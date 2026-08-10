const Roadmap = require("../models/Roadmap.model");
const Phase = require("../models/Phase.model");
const Milestone = require("../models/Milestone.model");
const templateService = require("./template.service");
const aiService = require("./ai.service");

// Populates an already-created roadmap with phases + AI-generated milestones.
// Runs in the background — does NOT create the Roadmap doc itself.
exports.populateRoadmap = async (
  roadmapId,
  goal,
  timeframe,
  userPreferences,
) => {
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
};

// Kept for backward compatibility / synchronous use elsewhere (e.g. tests).
// Creates the roadmap AND awaits full population — original blocking behavior.
exports.createRoadmap = async (req, res, next) => {
  try {
    const { goal, targetTimeframe } = req.body;
    const userPreferences = {
      skillLevel: req.user.skillLevel,
      hoursPerDay: req.user.hoursPerDay,
    };

    const roadmap = await Roadmap.create({
      user: req.user._id,
      goal,
      targetTimeframe,
      status: "generating",
    });

    // fire-and-forget — don't await
    roadmapGenerator
      .populateRoadmap(roadmap._id, goal, targetTimeframe, userPreferences)
      .catch((err) => console.error("Background generation failed:", err));

    res.status(202).json({
      status: "success",
      data: { roadmap },
    });
  } catch (error) {
    next(error);
  }
};

// --- Tier 1 addition: regenerate a single phase ---
const AppError = require("../utils/appError");
const User = require("../models/User.model");

exports.regeneratePhase = async (phaseId, roadmapId, userId) => {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, user: userId });
  if (!roadmap) throw new AppError("Roadmap not found", 404);

  const phase = await Phase.findOne({ _id: phaseId, roadmap: roadmapId });
  if (!phase) throw new AppError("Phase not found", 404);

  const user = await User.findById(userId);
  const userPreferences = {
    skillLevel: user.skillLevel,
    hoursPerDay: user.hoursPerDay,
  };

  await Milestone.deleteMany({ phase: phase._id });

  const milestonesData = await aiService.generateMilestonesForPhase(
    phase.title,
    roadmap.goal,
    userPreferences,
    roadmap.targetTimeframe,
  );

  const existingMax = await Milestone.findOne({})
    .sort("-order")
    .select("order");
  let order = (existingMax?.order || 0) + 1;

  const milestonesToInsert = milestonesData.map((m) => ({
    ...m,
    phase: phase._id,
    order: order++,
  }));

  await Milestone.insertMany(milestonesToInsert);

  return Milestone.find({ phase: phase._id }).sort("order");
};
