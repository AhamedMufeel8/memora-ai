require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');

const app = express();

app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow all origins in development
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api', limiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/tutor', require('./routes/tutorRoutes'));
app.use('/api/notes', require('./routes/note.routes'));
app.use('/api/flashcards', require('./routes/flashcard.routes'));

app.use('/api/quiz', require('./routes/quizRoutes'));
app.use('/api/quizzes', require('./routes/quiz.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/books', require('./routes/book.routes'));
app.use('/api/uploads', require('./routes/upload.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));

app.use((err, req, res, next) => {
  console.error('[API Error]', err);

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'PDF is too large. Maximum file size is 10MB.'
      : err.message;

    return res.status(400).json({ success: false, message });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Server Error';

  res.status(statusCode).json({ success: false, message });
});

module.exports = app;
