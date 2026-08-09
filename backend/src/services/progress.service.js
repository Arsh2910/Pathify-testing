const Phase = require("../models/Phase.model");
const Milestone = require("../models/Milestone.model");

exports.getRoadmapProgress = async (roadmapId) => {
  const phases = await Phase.find({ roadmap: roadmapId }).select("_id");
  const phaseIds = phases.map((p) => p._id);

  const total = await Milestone.countDocuments({ phase: { $in: phaseIds } });
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

exports.updateStreak = async (user) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const last = user.lastActivityDate ? new Date(user.lastActivityDate) : null;
  if (last) last.setHours(0, 0, 0, 0);

  if (!last) {
    user.currentStreak = 1;
  } else {
    const dayDiff = Math.round((today - last) / (1000 * 60 * 60 * 24));
    if (dayDiff === 0) {
      // already logged activity today, no change
    } else if (dayDiff === 1) {
      user.currentStreak += 1;
    } else {
      user.currentStreak = 1; // streak broken, restart
    }
  }

  user.longestStreak = Math.max(user.longestStreak, user.currentStreak);
  user.lastActivityDate = today;
  await user.save({ validateBeforeSave: false });
};
