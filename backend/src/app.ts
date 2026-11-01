import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes";
import roadmapRoutes from "./routes/roadmap.routes";
import milestoneRoutes from "./routes/milestone.routes";
import globalErrorHandler from "./middlewares/error.middleware";
import AppError from "./utils/appError";

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());

// General rate limiter: max 600 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many requests from this IP, please try again in 15 minutes.",
  },
});
app.use("/api", generalLimiter);

// Auth rate limiter: max 50 requests per 15 minutes per IP (protects brute-force & email resets)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many authentication attempts, please try again in 15 minutes.",
  },
});
app.use("/api/v1/auth", authLimiter);

// Body parser
app.use(express.json({ limit: "10kb" }));

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/roadmaps", roadmapRoutes);
app.use("/api/v1/milestones", milestoneRoutes);

// Handle undefined routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
