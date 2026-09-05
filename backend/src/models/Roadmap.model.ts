import mongoose from "mongoose";

export interface IRoadmap {
  user: mongoose.Types.ObjectId;
  goal: string;
  targetTimeframe: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
  hoursPerDay: number;
  status: "generating" | "active" | "completed" | "abandoned";
}

const roadmapSchema = new mongoose.Schema<IRoadmap>(
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
    skillLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    hoursPerDay: {
      type: Number,
      min: 0.5,
      max: 24,
      required: true,
    },
    status: {
      type: String,
      enum: ["generating", "active", "completed", "abandoned"],
      default: "active",
    },
  },
  { timestamps: true },
);

const Roadmap = mongoose.model<IRoadmap>("Roadmap", roadmapSchema);

export default Roadmap;
