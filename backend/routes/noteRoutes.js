const express = require('express');
const router = express.Router();
const {
  uploadNote,
  getNotes,
  getNoteById,
  deleteNote,
  queryNote
} = require('../controllers/noteController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/upload', protect, upload.single('file'), uploadNote);
router.get('/', protect, getNotes);

router
  .route('/:id')
  .get(protect, getNoteById)
  .delete(protect, deleteNote);

router.post('/:id/query', protect, queryNote);

module.exports = router;
