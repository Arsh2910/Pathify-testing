const mongoose = require("mongoose");

const roadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    goal: {
      type: String,
      required: [true, "Learning goal is required"],
      trim: true,
    },
    targetTimeframe: {
      type: String,
      required: [true, "Target timeframe is required"],
    },
    status: {
      type: String,
      enum: ["generating", "active", "completed", "abandoned"],
      default: "active",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Roadmap", roadmapSchema);
