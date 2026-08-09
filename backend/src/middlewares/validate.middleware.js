const Joi = require("joi");
const AppError = require("../utils/appError");

const validateRequest = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map((d) => d.message).join(", ");
    return next(new AppError(errorMessage, 400));
  }
  req.body = value;
  next();
};
module.exports = { validateRequest };
