const mongoose = require('mongoose');

const deckCardSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    default: 'General',
  },
}, { _id: true });

const flashcardDeckSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    default: 'AI Flashcard Deck',
  },
  sourceType: {
    type: String,
    enum: ['text', 'pdf', 'book', 'rag'],
    default: 'text',
  },
  sourceName: {
    type: String,
    default: 'Pasted notes',
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate',
  },
  topics: {
    type: [String],
    default: [],
  },
  cardCount: {
    type: Number,
    default: 0,
  },
  flashcards: {
    type: [deckCardSchema],
    default: [],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FlashcardDeck', flashcardDeckSchema);
