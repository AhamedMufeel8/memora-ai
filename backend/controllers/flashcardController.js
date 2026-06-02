const fs = require('fs/promises');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const Flashcard = require('../models/Flashcard');
const FlashcardDeck = require('../models/FlashcardDeck');
const FlashcardStudy = require('../models/FlashcardStudy');
const StudyLog = require('../models/StudyLog');
const {
  clampCardCount,
  generateFlashcardsWithGemini,
  normalizeDifficulty,
} = require('../services/flashcardService');

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
    console.log('[Flashcards] Upload cleanup skipped:', error.message);
  }
};

const extractPdfText = async (file) => {
  if (!file?.path) {
    throw new AppError('Missing PDF file', 400);
  }

  try {
    const dataBuffer = await fs.readFile(path.resolve(file.path));
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
    console.error('[Flashcards] PDF extraction error:', error);
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

const deckOwnerQuery = (req, deckId) => ({
  _id: deckId,
  userId: req.user._id,
});

const generateFlashcards = async (req, res) => {
  const uploadedPath = req.file?.path;

  try {
    const sourceText = await resolveSourceText(req);
    const difficulty = normalizeDifficulty(req.body.difficulty);
    const cardCount = clampCardCount(req.body.cardCount);

    if (!sourceText || sourceText.length < MIN_TEXT_LENGTH) {
      throw new AppError('Please provide at least 80 characters of readable study material.', 400);
    }

    const generated = await generateFlashcardsWithGemini({
      text: sourceText,
      difficulty,
      cardCount,
    });

    const deck = await FlashcardDeck.create({
      userId: req.user._id,
      title: generated.title,
      sourceText,
      sourceType: req.file ? 'pdf' : 'text',
      sourceName: req.file?.originalname || 'Pasted notes',
      difficulty: generated.difficulty,
      topics: generated.topics,
      cardCount: generated.flashcards.length,
      flashcards: generated.flashcards,
    });

    await FlashcardStudy.create({
      userId: req.user._id,
      deckId: deck._id,
      studiedCards: 0,
      masteredCards: 0,
      studyTime: 0,
      cardProgress: [],
    });

    res.status(201).json({ success: true, data: deck });
  } catch (error) {
    console.error('[Flashcards] Generate error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 429
        ? error.message
        : error.message || 'AI flashcard generation failed. Please try again.',
    });
  } finally {
    await cleanupFile(uploadedPath);
  }
};

const getDecks = async (req, res) => {
  const search = String(req.query.search || '').trim();
  const query = { userId: req.user._id };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { sourceName: { $regex: search, $options: 'i' } },
      { topics: { $regex: search, $options: 'i' } },
    ];
  }

  const decks = await FlashcardDeck.find(query)
    .sort({ createdAt: -1 })
    .select('-sourceText');
  const studies = await FlashcardStudy.find({
    userId: req.user._id,
    deckId: { $in: decks.map((deck) => deck._id) },
  });
  const studyByDeck = new Map(studies.map((study) => [String(study.deckId), study]));

  res.json({
    success: true,
    data: decks.map((deck) => ({
      ...deck.toObject(),
      study: studyByDeck.get(String(deck._id)) || null,
    })),
  });
};

const getDeckById = async (req, res) => {
  const deck = await FlashcardDeck.findOne(deckOwnerQuery(req, req.params.id));
  if (!deck) {
    return res.status(404).json({ success: false, message: 'Flashcard deck not found' });
  }

  const study = await FlashcardStudy.findOne({
    userId: req.user._id,
    deckId: deck._id,
  });

  res.json({ success: true, data: { ...deck.toObject(), study } });
};

const renameDeck = async (req, res) => {
  const title = String(req.body.title || '').trim();
  if (title.length < 2) {
    return res.status(400).json({ success: false, message: 'Deck title is required' });
  }

  const deck = await FlashcardDeck.findOneAndUpdate(
    deckOwnerQuery(req, req.params.id),
    { title: title.slice(0, 120) },
    { new: true }
  );

  if (!deck) {
    return res.status(404).json({ success: false, message: 'Flashcard deck not found' });
  }

  res.json({ success: true, data: deck });
};

const deleteDeck = async (req, res) => {
  const deck = await FlashcardDeck.findOneAndDelete(deckOwnerQuery(req, req.params.id));
  if (!deck) {
    return res.status(404).json({ success: false, message: 'Flashcard deck not found' });
  }

  await FlashcardStudy.deleteMany({ userId: req.user._id, deckId: deck._id });
  res.json({ success: true, data: { id: deck._id } });
};

const recordStudy = async (req, res) => {
  const deck = await FlashcardDeck.findOne(deckOwnerQuery(req, req.params.id));
  if (!deck) {
    return res.status(404).json({ success: false, message: 'Flashcard deck not found' });
  }

  const rating = String(req.body.rating || '').toLowerCase();
  const cardId = String(req.body.cardId || '');
  const studyTime = Math.max(Number.parseInt(req.body.studyTime, 10) || 0, 0);

  if (!['easy', 'medium', 'hard'].includes(rating)) {
    return res.status(400).json({ success: false, message: 'Study rating must be easy, medium, or hard' });
  }

  const cardExists = deck.flashcards.some((card) => String(card._id) === cardId);
  if (!cardExists) {
    return res.status(400).json({ success: false, message: 'Card not found in deck' });
  }

  let study = await FlashcardStudy.findOne({ userId: req.user._id, deckId: deck._id });
  if (!study) {
    study = new FlashcardStudy({ userId: req.user._id, deckId: deck._id });
  }

  const existingIndex = study.cardProgress.findIndex((card) => String(card.cardId) === cardId);
  const nextProgress = {
    cardId,
    rating,
    reviewedAt: new Date(),
  };

  if (existingIndex >= 0) {
    study.cardProgress[existingIndex] = nextProgress;
  } else {
    study.cardProgress.push(nextProgress);
  }

  study.studiedCards = study.cardProgress.length;
  study.masteredCards = study.cardProgress.filter((card) => card.rating === 'easy').length;
  study.hardCards = study.cardProgress.filter((card) => card.rating === 'hard').length;
  study.studyTime += studyTime;
  study.lastStudied = new Date();

  await Promise.all([
    study.save(),
    StudyLog.create({
      userId: req.user._id,
      deckId: deck._id,
      cardId,
      rating,
      studyTime,
      timestamp: new Date(),
    }),
  ]);
  res.json({ success: true, data: study });
};

const getProgress = async (req, res) => {
  const decks = await FlashcardDeck.find({ userId: req.user._id }).select('_id cardCount createdAt');
  const studies = await FlashcardStudy.find({ userId: req.user._id }).sort({ lastStudied: -1 });

  const totalCards = decks.reduce((sum, deck) => sum + (deck.cardCount || 0), 0);
  const studiedCards = studies.reduce((sum, study) => sum + study.studiedCards, 0);
  const masteredCards = studies.reduce((sum, study) => sum + study.masteredCards, 0);
  const studyTime = studies.reduce((sum, study) => sum + study.studyTime, 0);
  const studiedDates = new Set(studies.map((study) => study.lastStudied?.toISOString().slice(0, 10)).filter(Boolean));
  const completionPercentage = totalCards ? Math.round((masteredCards / totalCards) * 100) : 0;

  res.json({
    success: true,
    data: {
      totalDecks: decks.length,
      totalCards,
      studiedCards,
      masteredCards,
      remainingCards: Math.max(totalCards - masteredCards, 0),
      studyTime,
      studyStreak: studiedDates.size,
      completionPercentage,
      recentStudies: studies.slice(0, 8),
    },
  });
};

const getFlashcards = async (req, res) => getDecks(req, res);

const createFlashcard = async (req, res) => {
  const question = String(req.body.question || req.body.front || '').trim();
  const answer = String(req.body.answer || req.body.back || '').trim();

  if (!question || !answer) {
    return res.status(400).json({ success: false, message: 'Question and answer are required' });
  }

  const card = await Flashcard.create({
    userId: req.user._id,
    question,
    answer,
    difficulty: req.body.difficulty || 'medium',
  });

  res.status(201).json({ success: true, data: card });
};

const toggleBookmarkFlashcard = async (_req, res) => {
  res.status(410).json({ success: false, message: 'Single-card bookmarks were replaced by flashcard decks.' });
};

const setDifficultyRating = async (_req, res) => {
  res.status(410).json({ success: false, message: 'Use deck study ratings instead.' });
};

const deleteFlashcard = async (req, res) => {
  await Flashcard.deleteOne({ _id: req.params.id, userId: req.user._id });
  res.json({ success: true, data: { id: req.params.id } });
};

const generateFlashcardsFromNote = generateFlashcards;

module.exports = {
  createFlashcard,
  deleteDeck,
  deleteFlashcard,
  generateFlashcards,
  generateFlashcardsFromNote,
  getDeckById,
  getDecks,
  getFlashcards,
  getProgress,
  recordStudy,
  renameDeck,
  setDifficultyRating,
  toggleBookmarkFlashcard,
};
