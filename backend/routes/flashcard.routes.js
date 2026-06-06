const express = require('express');
const router = express.Router();
const {
  getDecks,
  getDeckById,
  renameDeck,
  deleteDeck,
  recordStudy,
  getProgress,
  generateFlashcards,
  getFlashcards,
  createFlashcard,
  toggleBookmarkFlashcard,
  setDifficultyRating,
  deleteFlashcard,
  generateFlashcardsFromNote
} = require('../controllers/flashcard.controller');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router
  .route('/')
  .get(protect, getDecks)
  .post(protect, createFlashcard);

router.post('/generate', protect, upload.single('file'), generateFlashcards);
router.get('/progress', protect, getProgress);
router.get('/:id', protect, getDeckById);
router.put('/:id', protect, renameDeck);
router.delete('/:id', protect, deleteDeck);
router.post('/:id/study', protect, recordStudy);

router.put('/:id/bookmark', protect, toggleBookmarkFlashcard);
router.put('/:id/difficulty', protect, setDifficultyRating);
router.delete('/:id', protect, deleteFlashcard);
router.post('/generate/:noteId', protect, generateFlashcardsFromNote);

module.exports = router;
