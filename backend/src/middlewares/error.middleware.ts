import AppError from "../utils/appError";
import type { ErrorRequestHandler } from "express";

interface DatabaseError extends Error {
  code?: number;
  path?: string;
  value?: unknown;
  errmsg?: string;
  errors?: Record<string, { message: string }>;
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

const handleCastErrorDB = (err: DatabaseError): AppError => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: DatabaseError): AppError => {
  const value = err.errmsg?.match(/([\"'])(\\?.)*?\1/)?.[0] || "value";
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: DatabaseError): AppError => {
  const errors = Object.values(err.errors || {}).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const globalErrorHandler: ErrorRequestHandler = (
  err: DatabaseError,
  req,
  res,
  next,
) => {
  // Set defaults on the original error object — avoids spread which loses
  // non-enumerable properties (message, name) and prototype chain (isOperational)
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Transform known DB/library errors into operational AppErrors
  let error: DatabaseError | AppError = err;
  if (err.name === "CastError") error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === "ValidationError") error = handleValidationErrorDB(err);

  if (error.isOperational) {
    res.status(error.statusCode!).json({
      status: error.status,
      message: error.message,
    });
  } else {
    console.error("ERROR 💥", error);
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

export default globalErrorHandler;
