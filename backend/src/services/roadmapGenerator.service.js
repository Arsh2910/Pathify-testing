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
