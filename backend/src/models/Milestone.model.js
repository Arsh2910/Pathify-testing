const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  link: { type: String, required: true },
  type: { type: String, enum: ['video', 'article', 'course', 'book', 'other'], default: 'other' }
}, { _id: false });

const milestoneSchema = new mongoose.Schema({
  phase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Phase',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Milestone title is required'],
  },
  description: {
    type: String,
    required: true,
  },
  microFirstStep: {
    type: String,
    required: [true, 'Micro first-step is required to beat procrastination'],
  },
  whyNow: {
    type: String,
    required: [true, 'Why now framing is required'],
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
  }
}, { timestamps: true });

module.exports = mongoose.model('Milestone', milestoneSchema);
