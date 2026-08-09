const Milestone = require("../models/Milestone.model");
const AppError = require("../utils/appError");
const Phase = require("../models/Phase.model");
const Roadmap = require("../models/Roadmap.model");

exports.updateMilestone = async (req, res, next) => {
  try {
    const { isCompleted } = req.body;

    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) {
      return next(new AppError("No milestone found with that ID", 404));
    }

    // Security check: ensure the roadmap belongs to the current user
    const phase = await Phase.findById(milestone.phase);
    if (!phase) return next(new AppError("Associated phase not found", 404));

    const roadmap = await Roadmap.findById(phase.roadmap);
    if (!roadmap)
      return next(new AppError("Associated roadmap not found", 404));
    if (roadmap.user.toString() !== req.user._id.toString()) {
      return next(
        new AppError(
          "You do not have permission to update this milestone",
          403,
        ),
      );
    }

    milestone.isCompleted = isCompleted;
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
