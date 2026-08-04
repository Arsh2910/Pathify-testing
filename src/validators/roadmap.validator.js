const Joi = require('joi');

const createRoadmapSchema = Joi.object({
  goal: Joi.string().required().min(3).max(100),
  targetTimeframe: Joi.string().required().max(50),
});

module.exports = {
  createRoadmapSchema,
};
