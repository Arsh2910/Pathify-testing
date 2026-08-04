const mongoose = require('mongoose');

const phaseSchema = new mongoose.Schema({
  roadmap: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roadmap',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Phase title is required'],
  },
  order: {
    type: Number,
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Phase', phaseSchema);
