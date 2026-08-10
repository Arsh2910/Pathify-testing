const Joi = require("joi");

const createRoadmapSchema = Joi.object({
  goal: Joi.string().required().min(3).max(100),
  targetTimeframe: Joi.string().required().max(50),
  skillLevel: Joi.string()
    .valid("beginner", "intermediate", "advanced")
    .required(),
  hoursPerDay: Joi.number().min(0.5).max(24).required(),
});

module.exports = {
  createRoadmapSchema,
};
