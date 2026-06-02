const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const {
  startSession,
  endSession,
  getWeeklyStudyTime,
} = require('../controllers/analytics.controller');

router.post('/session/start', protect, startSession);
router.post('/session/end', protect, endSession);
router.get('/weekly-study-time', protect, getWeeklyStudyTime);

module.exports = router;

