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
      type: String, // e.g., "3 months", "6 weeks"
      required: [true, "Target timeframe is required"],
    },
    status: {
      type: String,
      enum: ["generating", "active", "completed", "abandoned"],
      default: "active",
    },
  },
  roadmapSchema.virtual("completionStats").get(function () {
    return this._completionStats || null;
  }),
  { timestamps: true },
);

module.exports = mongoose.model("Roadmap", roadmapSchema);
