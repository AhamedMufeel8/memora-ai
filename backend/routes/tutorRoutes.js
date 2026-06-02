const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createSession,
  listSessions,
  getSession,
  sendMessage,
  renameSession,
  deleteSession
} = require('../controllers/tutorController');

const router = express.Router();

// Apply authorization guard globally to all tutor routes
router.use(protect);

router.route('/')
  .post(createSession)
  .get(listSessions);

router.route('/:id')
  .get(getSession)
  .put(renameSession)
  .delete(deleteSession);

router.post('/:id/chat', sendMessage);

module.exports = router;
