const mongoose = require('mongoose');

const studyLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  deckId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FlashcardDeck',
    required: true,
  },
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  rating: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  studyTime: {
    type: Number, // in seconds
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('StudyLog', studyLogSchema);
