const express = require('express');
const { summarizeText } = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.post('/summarize', protect, upload.single('file'), summarizeText);

module.exports = router;
