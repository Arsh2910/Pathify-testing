import Roadmap from "../models/Roadmap.model";
import Phase from "../models/Phase.model";
import Milestone from "../models/Milestone.model";
import templateService from "./template.service";
import aiService from "./ai.service";
import type { UserPreferences } from "./ai.service";
import AppError from "../utils/appError";
import mongoose from "mongoose";

// Populates an already-created roadmap with phases + AI-generated milestones.
// Runs in the background — does NOT create the Roadmap doc itself.
export async function populateRoadmap(
  roadmapId: string,
  goal: string,
  timeframe: string,
  userPreferences: UserPreferences,
) {
  const roadmap = await Roadmap.findById(roadmapId);
  if (!roadmap)
    throw new Error(`Roadmap ${roadmapId} not found during population`);

  try {
    const phaseTemplates = templateService.getPhaseTemplates(goal);
    let globalMilestoneOrder = 1;

    for (const pTemplate of phaseTemplates) {
      const phase = await Phase.create({
        roadmap: roadmap._id,
        title: pTemplate.title,
        order: pTemplate.order,
      });

      const milestonesData = await aiService.generateMilestonesForPhase(
        pTemplate.title,
        goal,
        userPreferences,
        timeframe,
      );

      const milestonesToInsert = milestonesData.map((m) => ({
        ...m,
        phase: phase._id,
        order: globalMilestoneOrder++,
      }));

      await Milestone.insertMany(milestonesToInsert);
    }

    roadmap.status = "active";
    await roadmap.save();
    return roadmap;
  } catch (error) {
    console.error("Error during roadmap generation:", error);

    // Clean up any partially-created phases/milestones
    const phases = await Phase.find({ roadmap: roadmap._id });
    const phaseIds = phases.map((p) => p._id);
    await Milestone.deleteMany({ phase: { $in: phaseIds } });
    await Phase.deleteMany({ roadmap: roadmap._id });

    roadmap.status = "abandoned";
    await roadmap.save();
    throw error;
  }
}

// --- Tier 1 addition: regenerate a single phase ---
export async function regeneratePhaseService(
  phaseId: mongoose.Types.ObjectId,
  roadmapId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
) {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, user: userId });
  if (!roadmap) throw new AppError("Roadmap not found", 404);

  const phase = await Phase.findOne({ _id: phaseId, roadmap: roadmapId });
  if (!phase) throw new AppError("Phase not found", 404);

  const userPreferences = {
    skillLevel: roadmap.skillLevel,
    hoursPerDay: roadmap.hoursPerDay,
  };

  await Milestone.deleteMany({ phase: phase._id });

  const milestonesData = await aiService.generateMilestonesForPhase(
    phase.title,
    roadmap.goal,
    userPreferences,
    roadmap.targetTimeframe,
  );

  const existingMax = await Milestone.findOne({}).sort("-order").select("order");
  let order = (existingMax?.order || 0) + 1;

  const milestonesToInsert = milestonesData.map((m) => ({
    ...m,
    phase: phase._id,
    order: order++,
  }));

  await Milestone.insertMany(milestonesToInsert);

  return Milestone.find({ phase: phase._id }).sort("order");
}
