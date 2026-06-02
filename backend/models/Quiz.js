const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['mcq'],
    required: true,
    default: 'mcq'
  },
  question: {
    type: String,
    required: true
  },
  options: {
    type: [String], // Options A, B, C, D (empty for fill in the blank)
    default: []
  },
  correctAnswer: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
    default: ''
  }
});

const quizSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    default: 'Untitled AI Quiz'
  },
  sourceType: {
    type: String,
    enum: ['text', 'pdf', 'rag'],
    default: 'text'
  },
  sourceName: {
    type: String,
    default: 'Pasted notes'
  },
  topics: {
    type: [String],
    default: []
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  questionCount: {
    type: Number,
    default: 0
  },
  questions: [questionSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Quiz', quizSchema);
