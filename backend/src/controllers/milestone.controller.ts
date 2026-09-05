import Milestone from "../models/Milestone.model";
import AppError from "../utils/appError";
import Phase from "../models/Phase.model";
import Roadmap from "../models/Roadmap.model";
import { updateStreak, getRoadmapProgress } from "../services/progress.service";
import type { Request, Response, NextFunction } from "express";

export const updateMilestone = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { isCompleted } = req.body as { isCompleted: boolean };

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

    milestone.isCompleted = isCompleted;
    await milestone.save();

    if (isCompleted) {
      await updateStreak(req.user!);
    }

    const progress = await getRoadmapProgress(roadmap._id);

    res.status(200).json({
      status: "success",
      data: {
        milestone,
        progress,
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
