import mongoose from "mongoose";

interface PhaseT {
  roadmap: mongoose.Types.ObjectId;
  title: string;
  order: number;
}

const phaseSchema = new mongoose.Schema<PhaseT>(
  {
    roadmap: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Roadmap",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Phase title is required"],
    },
    order: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

const Phase = mongoose.model<PhaseT>("Phase", phaseSchema);

export default Phase;
