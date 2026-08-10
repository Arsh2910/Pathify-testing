const Roadmap = require("../models/Roadmap.model");
const Phase = require("../models/Phase.model");
const Milestone = require("../models/Milestone.model");
const roadmapGenerator = require("../services/roadmapGenerator.service");
const progressService = require("../services/progress.service");
const AppError = require("../utils/appError");

exports.createRoadmap = async (req, res, next) => {
  try {
    const { goal, targetTimeframe, skillLevel, hoursPerDay } = req.body;

    const roadmap = await Roadmap.create({
      user: req.user._id,
      goal,
      targetTimeframe,
      skillLevel,
      hoursPerDay,
      status: "generating",
    });

    const userPreferences = { skillLevel, hoursPerDay };

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

exports.getRoadmaps = async (req, res, next) => {
  try {
    const roadmaps = await Roadmap.find({ user: req.user._id }).sort(
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
};

exports.getRoadmapDetails = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!roadmap)
      return next(new AppError("No roadmap found with that ID", 404));

    const phases = await Phase.find({ roadmap: roadmap._id })
      .sort("order")
      .lean();
    for (let phase of phases) {
      phase.milestones = await Milestone.find({ phase: phase._id })
        .sort("order")
        .lean();
    }

    const progress = await progressService.getRoadmapProgress(roadmap._id);

    res.status(200).json({
      status: "success",
      data: { roadmap, phases, progress },
    });
  } catch (error) {
    next(error);
  }
};
exports.regeneratePhase = async (phaseId, roadmapId, userId) => {
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
exports.getNextTask = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user._id,
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
};
exports.abandonRoadmap = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!roadmap)
      return next(new AppError("No roadmap found with that ID", 404));

    roadmap.status = "abandoned";
    await roadmap.save();

    res.status(200).json({ status: "success", data: { roadmap } });
  } catch (error) {
    next(error);
  }
};

exports.deleteRoadmap = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user._id,
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
};
