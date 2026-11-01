import Milestone from "../models/Milestone.model";
import AppError from "../utils/appError";
import Phase from "../models/Phase.model";
import Roadmap from "../models/Roadmap.model";
import { updateStreak, getRoadmapProgress } from "../services/progress.service";
import aiService from "../services/ai.service";
import type { Request, Response, NextFunction } from "express";

export const updateMilestone = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { isCompleted, notes } = req.body as {
      isCompleted?: boolean;
      notes?: string;
    };

    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) {
      return next(new AppError("No milestone found with that ID", 404));
    }

    const phase = await Phase.findById(milestone.phase);
    if (!phase) return next(new AppError("Associated phase not found", 404));

    const roadmap = await Roadmap.findById(phase.roadmap);
    if (!roadmap)
      return next(new AppError("Associated roadmap not found", 404));

    if (roadmap.user.toString() !== req.user!._id.toString()) {
      return next(
        new AppError(
          "You do not have permission to update this milestone",
          403,
        ),
      );
    }

    if (typeof isCompleted === "boolean") {
      milestone.isCompleted = isCompleted;
      if (isCompleted) {
        milestone.completedAt = new Date();
        await updateStreak(req.user!);
      } else {
        milestone.set("completedAt", undefined);
      }
    }

    if (typeof notes === "string") {
      milestone.notes = notes;
    }

    await milestone.save();

    const progress = await getRoadmapProgress(roadmap._id);

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
      data: {
        milestone,
        progress,
        roadmap,
        streak: {
          currentStreak: req.user!.currentStreak,
          longestStreak: req.user!.longestStreak,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshMilestoneResources = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) {
      return next(new AppError("No milestone found with that ID", 404));
    }

    const phase = await Phase.findById(milestone.phase);
    if (!phase) return next(new AppError("Associated phase not found", 404));

    const roadmap = await Roadmap.findById(phase.roadmap);
    if (!roadmap)
      return next(new AppError("Associated roadmap not found", 404));

    if (roadmap.user.toString() !== req.user!._id.toString()) {
      return next(
        new AppError(
          "You do not have permission to update this milestone",
          403,
        ),
      );
    }

    const freshResources = await aiService.generateResourcesForMilestone(
      milestone.title,
      roadmap.goal,
      roadmap.skillLevel,
    );

    milestone.resources = freshResources;
    await milestone.save();

    res.status(200).json({
      status: "success",
      data: {
        milestone,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createMilestone = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { phaseId } = req.params;
    const { title, description, microFirstStep, whyNow, suggestedTimeBox } =
      req.body as {
        title?: string;
        description?: string;
        microFirstStep?: string;
        whyNow?: string;
        suggestedTimeBox?: string;
      };

    const phase = await Phase.findById(phaseId);
    if (!phase) return next(new AppError("Phase not found", 404));

    const roadmap = await Roadmap.findById(phase.roadmap);
    if (!roadmap) return next(new AppError("Roadmap not found", 404));

    if (roadmap.user.toString() !== req.user!._id.toString()) {
      return next(new AppError("Unauthorized", 403));
    }

    const count = await Milestone.countDocuments({ phase: phase._id });

    const newMilestone = await Milestone.create({
      phase: phase._id,
      title: title?.trim() || "New Milestone",
      description: description?.trim() || "Custom learning step",
      microFirstStep:
        microFirstStep?.trim() || "Spend 5 minutes reviewing the core concept",
      whyNow:
        whyNow?.trim() || "Small consistent steps lead to mastery",
      suggestedTimeBox: suggestedTimeBox?.trim() || "30 minutes",
      resources: [],
      isCompleted: false,
      order: count + 1,
    });

    const progress = await getRoadmapProgress(roadmap._id);

    res.status(201).json({
      status: "success",
      data: {
        milestone: newMilestone,
        progress,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const breakdownMilestone = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) {
      return next(new AppError("No milestone found with that ID", 404));
    }

    const phase = await Phase.findById(milestone.phase);
    if (!phase) return next(new AppError("Associated phase not found", 404));

    const roadmap = await Roadmap.findById(phase.roadmap);
    if (!roadmap)
      return next(new AppError("Associated roadmap not found", 404));

    if (roadmap.user.toString() !== req.user!._id.toString()) {
      return next(
        new AppError(
          "You do not have permission to access this milestone",
          403,
        ),
      );
    }

    const babySteps = await aiService.breakdownMilestone(
      milestone.title,
      milestone.description,
      milestone.microFirstStep,
    );

    res.status(200).json({
      status: "success",
      data: {
        milestoneId: milestone._id,
        babySteps,
      },
    });
  } catch (error) {
    next(error);
  }
};

