const Roadmap = require('../models/Roadmap.model');
const Phase = require('../models/Phase.model');
const Milestone = require('../models/Milestone.model');
const roadmapGenerator = require('../services/roadmapGenerator.service');
const AppError = require('../utils/appError');

exports.createRoadmap = async (req, res, next) => {
  try {
    const { goal, targetTimeframe } = req.body;
    const userPreferences = {
      skillLevel: req.user.skillLevel,
      hoursPerDay: req.user.hoursPerDay
    };

    // This runs asynchronously in the background so we don't block the request if it takes long
    // However, for simplicity in this project, we'll await it. If it times out, we should implement a queue (like BullMQ).
    const roadmap = await roadmapGenerator.createRoadmap(
      req.user._id,
      goal,
      targetTimeframe,
      userPreferences
    );

    res.status(201).json({
      status: 'success',
      data: {
        roadmap
      }
    });
  } catch (error) {
    next(new AppError('Failed to generate roadmap: ' + error.message, 500));
  }
};

exports.getRoadmaps = async (req, res, next) => {
  try {
    const roadmaps = await Roadmap.find({ user: req.user._id }).sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: roadmaps.length,
      data: {
        roadmaps
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getRoadmapDetails = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!roadmap) {
      return next(new AppError('No roadmap found with that ID', 404));
    }

    // Fetch phases and milestones for progressive disclosure
    const phases = await Phase.find({ roadmap: roadmap._id }).sort('order').lean();
    
    // Attach milestones to each phase
    for (let phase of phases) {
      const milestones = await Milestone.find({ phase: phase._id }).sort('order').lean();
      phase.milestones = milestones;
    }

    res.status(200).json({
      status: 'success',
      data: {
        roadmap,
        phases
      }
    });
  } catch (error) {
    next(error);
  }
};
