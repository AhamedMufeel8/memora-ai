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
    // Allow requests with no origin (e.g. Postman, curl)
    if (!origin) return callback(null, true);
    // In development allow any localhost port (Vite may use 5173-5200+)
    const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
    if (isLocalhost || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    // In production, restrict to CLIENT_URL
    const allowed = [process.env.CLIENT_URL].filter(Boolean);
    if (allowed.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(morgan('dev'));

const isDev = process.env.NODE_ENV !== 'production';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // 2000 in dev (effectively unlimited), 200 in production
  max: isDev ? 2000 : 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});
// Apply rate limiter to all /api routes except analytics (which fires on every nav/unload)
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/analytics')) return next();
  return limiter(req, res, next);
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/auth', require('./routes/googleAuth.routes'));
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/tutor', require('./routes/tutor.routes'));
app.use('/api/notes', require('./routes/note.routes'));
app.use('/api/flashcards', require('./routes/flashcard.routes'));

app.use('/api/quiz', require('./routes/quiz.routes'));
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
