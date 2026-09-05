import mongoose, { type HydratedDocument } from "mongoose";

import Phase from "../models/Phase.model";
import Milestone from "../models/Milestone.model";
import type { IUser } from "../models/User.model";

type UserDocument = HydratedDocument<IUser>;

export const getRoadmapProgress = async (
  roadmapId: mongoose.Types.ObjectId,
): Promise<{
  total: number;
  completed: number;
  percentage: number;
}> => {
  const phases = await Phase.find({
    roadmap: roadmapId,
  }).select("_id");

  const phaseIds = phases.map((p) => p._id);

  const total = await Milestone.countDocuments({
    phase: { $in: phaseIds },
  });

  const completed = await Milestone.countDocuments({
    phase: { $in: phaseIds },
    isCompleted: true,
  });

  return {
    total,
    completed,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
};

export const updateStreak = async (user: UserDocument) => {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const last = user.lastActivityDate ? new Date(user.lastActivityDate) : null;

  if (last) {
    last.setHours(0, 0, 0, 0);
  }

  if (!last) {
    user.currentStreak = 1;
  } else {
    const dayDiff = Math.round(
      (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (dayDiff === 0) {
      // Already logged activity today.
    } else if (dayDiff === 1) {
      user.currentStreak += 1;
    } else {
      user.currentStreak = 1;
    }
  }

  user.longestStreak = Math.max(user.longestStreak, user.currentStreak);

  user.lastActivityDate = today;

  await user.save({
    validateBeforeSave: false,
  });
};
