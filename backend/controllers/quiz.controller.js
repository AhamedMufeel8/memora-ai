const fs = require('fs/promises');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const { clampQuestionCount,
  generateQuizWithGemini,
  normalizeDifficulty,
} = require('../services/quiz.service');

const MIN_TEXT_LENGTH = 80;

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

const cleanupFile = async (filePath) => {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.log('[Quiz] Upload cleanup skipped:', error.message);
  }
};

const extractPdfText = async (file) => {
  if (!file?.path) {
    throw new AppError('Missing PDF file', 400);
  }

  try {
    const resolvedPath = path.resolve(file.path);
    const dataBuffer = await fs.readFile(resolvedPath);

    if (!dataBuffer.length) {
      throw new AppError('Uploaded PDF is empty', 400);
    }

    const parser = new PDFParse({ data: dataBuffer });
    let pdfData;

    try {
      pdfData = await parser.getText();
    } finally {
      await parser.destroy();
    }

    const text = String(pdfData.text || '').trim();
    if (!text) {
      throw new AppError('PDF extraction failed: no readable text found', 422);
    }

    return text;
  } catch (error) {
    if (error.statusCode) throw error;
    console.error('[Quiz] PDF extraction error:', error);
    throw new AppError('PDF extraction failed. The file may be corrupted, encrypted, or scanned as images.', 422);
  }
};

const resolveSourceText = async (req) => {
  const pastedText = typeof req.body.text === 'string' ? req.body.text.trim() : '';
  if (req.file) {
    return extractPdfText(req.file);
  }

  return pastedText;
};

const getQuizOwnerQuery = (req, quizId) => ({
  _id: quizId,
  userId: req.user._id,
});

const generateQuiz = async (req, res) => {
  const uploadedPath = req.file?.path;

  try {
    const sourceText = await resolveSourceText(req);
    const difficulty = normalizeDifficulty(req.body.difficulty);
    const questionCount = clampQuestionCount(req.body.questionCount);

    if (!sourceText || sourceText.length < MIN_TEXT_LENGTH) {
      throw new AppError('Please provide at least 80 characters of readable study material.', 400);
    }

    const generated = await generateQuizWithGemini({
      text: sourceText,
      difficulty,
      questionCount,
    });

    const quiz = await Quiz.create({
      userId: req.user._id,
      title: generated.title,
      sourceText,
      sourceType: req.file ? 'pdf' : 'text',
      sourceName: req.file?.originalname || 'Pasted notes',
      topics: generated.topics,
      difficulty: generated.difficulty,
      questionCount: generated.questions.length,
      questions: generated.questions,
    });

    res.status(201).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    console.error('[Quiz] Generate error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 429
        ? error.message
        : 'AI quiz generation failed. Please try again.',
    });
  } finally {
    await cleanupFile(uploadedPath);
  }
};

const getQuizzes = async (req, res) => {
  const search = String(req.query.search || '').trim();
  const query = { userId: req.user._id };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { sourceName: { $regex: search, $options: 'i' } },
      { topics: { $regex: search, $options: 'i' } },
    ];
  }

  const quizzes = await Quiz.find(query)
    .sort({ createdAt: -1 })
    .select('-sourceText');

  res.json({ success: true, data: quizzes });
};

const getQuizById = async (req, res) => {
  const quiz = await Quiz.findOne(getQuizOwnerQuery(req, req.params.id));

  if (!quiz) {
    return res.status(404).json({ success: false, message: 'Quiz not found' });
  }

  res.json({ success: true, data: quiz });
};

const deleteQuiz = async (req, res) => {
  const quiz = await Quiz.findOneAndDelete(getQuizOwnerQuery(req, req.params.id));

  if (!quiz) {
    return res.status(404).json({ success: false, message: 'Quiz not found' });
  }

  await QuizAttempt.deleteMany({ quizId: quiz._id, userId: req.user._id });
  res.json({ success: true, data: { id: quiz._id } });
};

const submitQuizScore = async (req, res) => {
  const quiz = await Quiz.findOne(getQuizOwnerQuery(req, req.params.id));

  if (!quiz) {
    return res.status(404).json({ success: false, message: 'Quiz not found' });
  }

  const submittedAnswers = Array.isArray(req.body.answers) ? req.body.answers : [];
  const answers = quiz.questions.map((question, index) => {
    const submitted = submittedAnswers.find((answer) => {
      const questionId = String(answer.questionId || answer.id || '');
      return questionId && questionId === String(question._id);
    }) || submittedAnswers[index] || {};

    const selectedAnswer = String(submitted.selectedAnswer || submitted.answer || '').trim();
    const isCorrect = selectedAnswer.toLowerCase() === String(question.correctAnswer).trim().toLowerCase();

    return {
      questionId: question._id,
      question: question.question,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      explanation: question.explanation,
    };
  });

  const score = answers.filter((answer) => answer.isCorrect).length;
  const totalQuestions = quiz.questions.length;
  const percentage = Math.round((score / totalQuestions) * 100);

  const attempt = await QuizAttempt.create({
    userId: req.user._id,
    quizId: quiz._id,
    score,
    percentage,
    totalQuestions,
    answers,
  });

  res.status(201).json({
    success: true,
    data: attempt,
  });
};

const getQuizAttempts = async (req, res) => {
  const attempts = await QuizAttempt.find({ userId: req.user._id })
    .sort({ completedAt: -1 })
    .populate('quizId', 'title difficulty topics sourceName questionCount createdAt');

  res.json({ success: true, data: attempts });
};

const getQuizAnalytics = async (req, res) => {
  const [attempts, totalQuizzes] = await Promise.all([
    QuizAttempt.find({ userId: req.user._id }).populate('quizId', 'topics difficulty title'),
    Quiz.countDocuments({ userId: req.user._id }),
  ]);

  const totalAttempts = attempts.length;
  const averageScore = totalAttempts
    ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / totalAttempts)
    : 0;
  const bestScore = totalAttempts
    ? Math.max(...attempts.map((attempt) => attempt.percentage))
    : 0;

  const topicStats = new Map();
  attempts.forEach((attempt) => {
    const topics = attempt.quizId?.topics?.length ? attempt.quizId.topics : [attempt.quizId?.title || 'General'];
    topics.forEach((topic) => {
      const existing = topicStats.get(topic) || { topic, attempts: 0, total: 0 };
      existing.attempts += 1;
      existing.total += attempt.percentage;
      topicStats.set(topic, existing);
    });
  });

  const rankedTopics = Array.from(topicStats.values())
    .map((topic) => ({ ...topic, average: Math.round(topic.total / topic.attempts) }))
    .sort((a, b) => a.average - b.average);

  res.json({
    success: true,
    data: {
      totalQuizzes,
      totalAttempts,
      averageScore,
      bestScore,
      weakTopics: rankedTopics.slice(0, 4),
      strongTopics: rankedTopics.slice(-4).reverse(),
    },
  });
};

module.exports = {
  deleteQuiz,
  generateQuiz,
  getQuizAnalytics,
  getQuizAttempts,
  getQuizById,
  getQuizzes,
  submitQuizScore,
};
