import Joi from "joi";
import AppError from "../utils/appError";
import type { RequestHandler } from "express";

export const validateRequest = (schema: Joi.ObjectSchema): RequestHandler => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessage = error.details.map((d) => d.message).join(", ");
      return next(new AppError(errorMessage, 400));
    }
    req.body = value;
    next();
  };
};
