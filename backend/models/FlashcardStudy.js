const mongoose = require('mongoose');

const cardProgressSchema = new mongoose.Schema({
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  rating: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  reviewedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const flashcardStudySchema = new mongoose.Schema({
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
    index: true,
  },
  studiedCards: {
    type: Number,
    default: 0,
  },
  masteredCards: {
    type: Number,
    default: 0,
  },
  hardCards: {
    type: Number,
    default: 0,
  },
  studyTime: {
    type: Number,
    default: 0,
  },
  cardProgress: {
    type: [cardProgressSchema],
    default: [],
  },
  lastStudied: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FlashcardStudy', flashcardStudySchema);
