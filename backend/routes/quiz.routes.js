const express = require('express');
const router = express.Router();
const {
  getQuizAnalytics,
  getQuizAttempts,
  getQuizzes,
  getQuizById,
  submitQuizScore,
  generateQuiz,
  deleteQuiz
} = require('../controllers/quiz.controller');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router
  .route('/')
  .get(protect, getQuizzes);

router.post('/generate', protect, upload.single('file'), generateQuiz);
router.get('/attempts', protect, getQuizAttempts);
router.get('/analytics', protect, getQuizAnalytics);

router
  .route('/:id')
  .get(protect, getQuizById)
  .delete(protect, deleteQuiz);

router.post('/:id/submit', protect, submitQuizScore);

module.exports = router;
