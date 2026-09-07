import Roadmap from "../models/Roadmap.model";
import Phase from "../models/Phase.model";
import Milestone from "../models/Milestone.model";
import aiService from "../services/ai.service";
import { populateRoadmap } from "../services/roadmapGenerator.service";
import { getRoadmapProgress } from "../services/progress.service";
import AppError from "../utils/appError";
import type { Request, Response, NextFunction } from "express";

export async function createRoadmap(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { goal, targetTimeframe, skillLevel, hoursPerDay } = req.body as {
      goal: string;
      targetTimeframe: string;
      skillLevel: "beginner" | "intermediate" | "advanced";
      hoursPerDay: number;
    };

    const roadmap = await Roadmap.create({
      user: req.user!._id,
      goal,
      targetTimeframe,
      skillLevel,
      hoursPerDay,
      status: "generating",
    });

    const userPreferences = { skillLevel, hoursPerDay };

    populateRoadmap(
      roadmap._id.toString(),
      goal,
      targetTimeframe,
      userPreferences,
    ).catch((err) => console.error("Background generation failed:", err));

    res.status(202).json({
      status: "success",
      data: { roadmap },
    });
  } catch (error) {
    next(error);
  }
}

export async function getRoadmaps(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const roadmaps = await Roadmap.find({ user: req.user!._id }).sort(
      "-createdAt",
    );

    res.status(200).json({
      status: "success",
      results: roadmaps.length,
      data: {
        roadmaps,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getRoadmapDetails(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user!._id,
    });
    if (!roadmap)
      return next(new AppError("No roadmap found with that ID", 404));

    const phases = await Phase.find({ roadmap: roadmap._id })
      .sort("order")
      .lean();
    for (const phase of phases) {
      const milestones = await Milestone.find({ phase: phase._id })
        .sort("order")
        .lean();
      Object.assign(phase, { milestones });
    }

    const progress = await getRoadmapProgress(roadmap._id);

    res.status(200).json({
      status: "success",
      data: { roadmap, phases, progress },
    });
  } catch (error) {
    next(error);
  }
}

export async function regeneratePhase(
  req: Request<{ id: string; phaseId: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id: roadmapId, phaseId } = req.params;
    const userId = req.user!._id;

    const roadmap = await Roadmap.findOne({ _id: roadmapId, user: userId });
    if (!roadmap) return next(new AppError("Roadmap not found", 404));

    const phase = await Phase.findOne({ _id: phaseId, roadmap: roadmap._id });
    if (!phase) return next(new AppError("Phase not found", 404));

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

    const milestones = await Milestone.find({ phase: phase._id }).sort("order");

    res.status(200).json({ status: "success", data: { milestones } });
  } catch (error) {
    next(error);
  }
}

export async function getNextTask(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user!._id,
    });
    if (!roadmap)
      return next(new AppError("No roadmap found with that ID", 404));

    const phases = await Phase.find({ roadmap: roadmap._id })
      .sort("order")
      .select("_id order");
    const phaseIds = phases.map((p) => p._id);

    const nextMilestone = await Milestone.findOne({
      phase: { $in: phaseIds },
      isCompleted: false,
    })
      .sort("order")
      .populate("phase", "title order");

    if (!nextMilestone) {
      return res.status(200).json({
        status: "success",
        data: { milestone: null, message: "All milestones completed! 🎉" },
      });
    }

    res
      .status(200)
      .json({ status: "success", data: { milestone: nextMilestone } });
  } catch (error) {
    next(error);
  }
}

export async function abandonRoadmap(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user!._id,
    });
    if (!roadmap)
      return next(new AppError("No roadmap found with that ID", 404));

    roadmap.status = "abandoned";
    await roadmap.save();

    res.status(200).json({ status: "success", data: { roadmap } });
  } catch (error) {
    next(error);
  }
}

export async function deleteRoadmap(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user!._id,
    });
    if (!roadmap)
      return next(new AppError("No roadmap found with that ID", 404));

    const phases = await Phase.find({ roadmap: roadmap._id }).select("_id");
    const phaseIds = phases.map((p) => p._id);

    await Milestone.deleteMany({ phase: { $in: phaseIds } });
    await Phase.deleteMany({ roadmap: roadmap._id });
    await Roadmap.deleteOne({ _id: roadmap._id });

    res.status(204).json({ status: "success", data: null });
  } catch (error) {
    next(error);
  }
}
