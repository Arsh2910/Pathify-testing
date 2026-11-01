import mongoose from "mongoose";

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface IMilestone {
  phase: mongoose.Types.ObjectId;
  title: string;
  description: string;
  microFirstStep: string;
  whyNow: string;
  suggestedTimeBox: string; // e.g., "30 minutes", "2 hours"
  resources: IResource[];
  isCompleted: boolean;
  order: number;
  notes?: string;
  completedAt?: Date;
  quiz?: IQuizQuestion[];
}

interface IResource {
  title: string;
  link: string;
  type: "video" | "article" | "course" | "book" | "other";
}

const resourceSchema = new mongoose.Schema<IResource>(
  {
    title: { type: String, required: true },
    link: { type: String, required: true },
    type: {
      type: String,
      enum: ["video", "article", "course", "book", "other"],
      default: "other",
    },
  },
  { _id: false },
);

const quizQuestionSchema = new mongoose.Schema<IQuizQuestion>(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswerIndex: { type: Number, required: true },
    explanation: { type: String, default: "" },
  },
  { _id: false },
);

const milestoneSchema = new mongoose.Schema<IMilestone>(
  {
    phase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Phase",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Milestone title is required"],
    },
    description: {
      type: String,
      required: true,
    },
    microFirstStep: {
      type: String,
      required: [true, "Micro first-step is required to beat procrastination"],
    },
    whyNow: {
      type: String,
      required: [true, "Why now framing is required"],
    },
    suggestedTimeBox: {
      type: String, // e.g., "30 minutes", "2 hours"
      required: true,
    },
    resources: [resourceSchema],
    isCompleted: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    completedAt: {
      type: Date,
    },
    quiz: {
      type: [quizQuestionSchema],
      default: undefined,
    },
  },
  { timestamps: true },
);

const Milestone = mongoose.model<IMilestone>("Milestone", milestoneSchema);
export default Milestone;
