const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  skillLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').default('beginner'),
  hoursPerDay: Joi.number().min(0.5).max(24).default(1),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
};
