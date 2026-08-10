const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/auth.routes");
const roadmapRoutes = require("./routes/roadmap.routes");
const milestoneRoutes = require("./routes/milestone.routes");

const globalErrorHandler = require("./middlewares/error.middleware");
const AppError = require("./utils/appError");

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: "https://trailhead-rlls.onrender.com",
    credentials: true,
  }),
);
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

module.exports = app;
