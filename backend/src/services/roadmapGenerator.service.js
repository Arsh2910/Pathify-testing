const AppError = require("../utils/appError");
const Roadmap = require("../models/Roadmap.model");
const Phase = require("../models/Phase.model");
const Milestone = require("../models/Milestone.model");
const templateService = require("./template.service");
const aiService = require("./ai.service");

exports.createRoadmap = async (userId, goal, timeframe, userPreferences) => {
  // 1. Create Roadmap entry (status: generating)
  const roadmap = await Roadmap.create({
    user: userId,
    goal,
    targetTimeframe: timeframe,
    status: "generating",
  });

  try {
    // 2. Get structural templates
    const phaseTemplates = templateService.getPhaseTemplates(goal);

    // 3. For each phase, call AI and save
    let globalMilestoneOrder = 1;

    for (const pTemplate of phaseTemplates) {
      // Save Phase to DB
      const phase = await Phase.create({
        roadmap: roadmap._id,
        title: pTemplate.title,
        order: pTemplate.order,
      });

      // Call AI to get milestones for this phase
      const milestonesData = await aiService.generateMilestonesForPhase(
        pTemplate.title,
        goal,
        userPreferences,
        timeframe,
      );

      // Save Milestones to DB
      const milestonesToInsert = milestonesData.map((m, index) => ({
        ...m,
        phase: phase._id,
        order: globalMilestoneOrder++,
      }));

      await Milestone.insertMany(milestonesToInsert);
    }

    // 4. Update Roadmap status to active
    roadmap.status = "active";
    await roadmap.save();

    return roadmap;
  } catch (error) {
    console.error("Error during roadmap generation:", error);
    const phases = await Phase.find({ roadmap: roadmap._id });
    await Milestone.deleteMany({ phase: { $in: phases.map((p) => p._id) } });
    await Phase.deleteMany({ roadmap: roadmap._id });
    roadmap.status = "abandoned";
    await roadmap.save();
    throw error;
  }
};
exports.regeneratePhase = async (phaseId, roadmapId, userId) => {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, user: userId });
  if (!roadmap) throw new AppError("Roadmap not found", 404);

  const phase = await Phase.findOne({ _id: phaseId, roadmap: roadmapId });
  if (!phase) throw new AppError("Phase not found", 404);

  const user = await require("../models/User.model").findById(userId);
  const userPreferences = {
    skillLevel: user.skillLevel,
    hoursPerDay: user.hoursPerDay,
  };

  // Remove old milestones for this phase
  await Milestone.deleteMany({ phase: phase._id });

  const milestonesData = await aiService.generateMilestonesForPhase(
    phase.title,
    roadmap.goal,
    userPreferences,
    roadmap.targetTimeframe,
  );

  // Preserve ordering relative to other phases — reuse the phase's existing milestone order range
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
