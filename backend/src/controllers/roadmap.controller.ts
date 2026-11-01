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
      goal?: string;
      targetTimeframe?: string;
      skillLevel?: "beginner" | "intermediate" | "advanced";
      hoursPerDay?: number;
    };

    const trimmedGoal = typeof goal === "string" ? goal.trim() : "";
    if (!trimmedGoal || trimmedGoal.length < 3 || trimmedGoal.length > 100) {
      return next(
        new AppError(
          "Goal must be between 3 and 100 characters and cannot consist of blank spaces",
          400,
        ),
      );
    }

    const validLevels = ["beginner", "intermediate", "advanced"];
    const sanitizedSkillLevel =
      typeof skillLevel === "string" && validLevels.includes(skillLevel)
        ? skillLevel
        : "beginner";

    const parsedHours = Number(hoursPerDay);
    if (isNaN(parsedHours) || parsedHours < 0.5 || parsedHours > 16) {
      return next(
        new AppError(
          "Daily study commitment must be a number between 0.5 and 16 hours/day",
          400,
        ),
      );
    }

    const trimmedTimeframe =
      typeof targetTimeframe === "string" && targetTimeframe.trim()
        ? targetTimeframe.trim().slice(0, 50)
        : "1 month";

    const roadmap = await Roadmap.create({
      user: req.user!._id,
      goal: trimmedGoal,
      targetTimeframe: trimmedTimeframe,
      skillLevel: sanitizedSkillLevel,
      hoursPerDay: parsedHours,
      status: "generating",
    });

    const userPreferences = { skillLevel: sanitizedSkillLevel, hoursPerDay: parsedHours };

    populateRoadmap(
      roadmap._id.toString(),
      trimmedGoal,
      trimmedTimeframe,
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

    // Sync status if all milestones are completed
    if (
      progress.total > 0 &&
      progress.completed === progress.total &&
      roadmap.status === "active"
    ) {
      roadmap.status = "completed";
      await roadmap.save();
    } else if (
      progress.completed < progress.total &&
      roadmap.status === "completed"
    ) {
      roadmap.status = "active";
      await roadmap.save();
    }

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

export async function getActivityStats(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const roadmaps = await Roadmap.find({ user: req.user!._id }).select(
      "_id status createdAt",
    );
    const roadmapIds = roadmaps.map((r) => r._id);

    const phases = await Phase.find({ roadmap: { $in: roadmapIds } }).select(
      "_id",
    );
    const phaseIds = phases.map((p) => p._id);

    const completedMilestones = await Milestone.find({
      phase: { $in: phaseIds },
      isCompleted: true,
    }).select("title completedAt updatedAt createdAt");

    const activityMap: Record<string, number> = {};
    for (const m of completedMilestones) {
      const dateObj =
        m.completedAt || (m as any).updatedAt || (m as any).createdAt;
      if (dateObj) {
        const dateKey = new Date(dateObj).toISOString().split("T")[0];
        if (dateKey) {
          activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;
        }
      }
    }

    const totalRoadmaps = roadmaps.length;
    const completedRoadmaps = roadmaps.filter(
      (r) => r.status === "completed",
    ).length;
    const activeRoadmaps = roadmaps.filter((r) => r.status === "active").length;

    res.status(200).json({
      status: "success",
      data: {
        currentStreak: req.user!.currentStreak || 0,
        longestStreak: req.user!.longestStreak || 0,
        totalCompletedMilestones: completedMilestones.length,
        totalRoadmaps,
        completedRoadmaps,
        activeRoadmaps,
        activityByDate: activityMap,
      },
    });
  } catch (error) {
    next(error);
  }
}

