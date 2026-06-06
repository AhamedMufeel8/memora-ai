const Book = require('../models/Book');
const User = require('../models/User');

// Curated demo books to seed when library is empty (giving immediate SaaS utility)
const DEFAULT_BOOKS = [
  {
    title: 'Quantum Mechanics & Modern Superposition',
    author: 'Dr. Evelyn Schrodinger',
    category: 'Physics',
    cover: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=256&h=380&fit=crop',
    summary: 'A definitive handbook exploring state vectors, wave-particle dualities, and mechanical limitations in micro-scales.',
    readPercent: 12,
    pages: 340,
    currentPage: 41,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    title: 'SaaS Systems Design & Scalable Frontends',
    author: 'Alex Premium, Tech Architect',
    category: 'Computer Science',
    cover: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=256&h=380&fit=crop',
    summary: 'Master full-stack architectures, high-performance UI optimization frameworks, caching nodes, and database connections.',
    readPercent: 45,
    pages: 280,
    currentPage: 126,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    title: 'Cognitive Science & Accelerated Learning',
    author: 'Prof. Marcus Brainwell',
    category: 'Neuroscience',
    cover: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=256&h=380&fit=crop',
    summary: 'Unlocking neuroplasticity principles, active recall retention, spaced-repetition models, and custom study structures.',
    readPercent: 0,
    pages: 180,
    currentPage: 1,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  }
];

/**
 * @desc    Get user library books (auto-seeded if empty)
 * @route   GET /api/books
 * @access  Private
 */
const getBooks = async (req, res) => {
  try {
    let books = await Book.find({ userId: req.user._id }).sort({ createdAt: -1 });

    if (books.length === 0) {
      // Seed default books
      const seedData = DEFAULT_BOOKS.map(book => ({
        ...book,
        userId: req.user._id
      }));
      books = await Book.insertMany(seedData);
    }

    res.json({
      success: true,
      data: books
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Add a new book to user's library
 * @route   POST /api/books
 * @access  Private
 */
const createBook = async (req, res) => {
  const { title, author, category, cover, summary, pages, audioUrl } = req.body;

  if (!title || !author) {
    return res.status(400).json({ success: false, message: 'Please provide book title and author' });
  }

  try {
    const book = await Book.create({
      title,
      author,
      category: category || 'General',
      cover: cover || undefined,
      summary: summary || '',
      pages: pages || 100,
      audioUrl: audioUrl || '',
      userId: req.user._id
    });

    res.status(201).json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update pages read progress
 * @route   PUT /api/books/:id/progress
 * @access  Private
 */
const updateBookProgress = async (req, res) => {
  const { currentPage } = req.body;

  if (currentPage === undefined || currentPage < 1) {
    return res.status(400).json({ success: false, message: 'Please provide a valid current page' });
  }

  try {
    const book = await Book.findOne({ _id: req.params.id, userId: req.user._id });
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    if (currentPage > book.pages) {
      return res.status(400).json({ success: false, message: `Page cannot exceed total book pages (${book.pages})` });
    }

    book.currentPage = currentPage;
    book.readPercent = Math.round((currentPage / book.pages) * 100);
    await book.save();

    // Reward XP for reading progress
    const user = await User.findById(req.user._id);
    if (user) {
      user.xp += 15;
      await user.save();
    }

    res.json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Toggle book bookmark status
 * @route   PUT /api/books/:id/bookmark
 * @access  Private
 */
const toggleBookmarkBook = async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, userId: req.user._id });
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    book.bookmarked = !book.bookmarked;
    await book.save();

    res.json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete a book from library
 * @route   DELETE /api/books/:id
 * @access  Private
 */
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBooks,
  createBook,
  updateBookProgress,
  toggleBookmarkBook,
  deleteBook
};
