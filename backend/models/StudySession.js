const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    feature: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      default: null,
      index: true,
    },
    durationMinutes: {
      type: Number,
      default: null,
      min: 0,
    },
  },
  { timestamps: true }
);

studySessionSchema.index({ userId: 1, startTime: -1 });

module.exports = mongoose.model('StudySession', studySessionSchema);

