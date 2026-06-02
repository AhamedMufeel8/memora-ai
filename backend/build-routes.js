const fs = require('fs');
const path = require('path');

const files = {
  'controllers/user.controller.js': `
const User = require('../models/User');
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
`,
  'routes/user.routes.js': `
const express = require('express');
const router = express.Router();
const { getProfile } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
router.get('/profile', protect, getProfile);
module.exports = router;
`,
  'routes/note.routes.js': `
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
router.get('/', protect, (req, res) => res.json({ success: true, data: [] }));
module.exports = router;
`,
  'routes/flashcard.routes.js': `
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
router.get('/', protect, (req, res) => res.json({ success: true, data: [] }));
module.exports = router;
`,
  'routes/quiz.routes.js': `
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
router.get('/', protect, (req, res) => res.json({ success: true, data: [] }));
module.exports = router;
`,
  'routes/chat.routes.js': `
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
router.get('/', protect, (req, res) => res.json({ success: true, data: [] }));
module.exports = router;
`,
  'routes/book.routes.js': `
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
router.get('/', protect, (req, res) => res.json({ success: true, data: [] }));
module.exports = router;
`,
  'routes/upload.routes.js': `
const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const { protect } = require('../middleware/auth');
router.post('/', protect, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, data: req.file.path });
});
module.exports = router;
`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(__dirname, filepath), content);
}

// Update app.js
const appJsPath = path.join(__dirname, 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');
appJs = appJs.replace('// app.use(\'/api/users\', require(\'./routes/user.routes\'));', 'app.use(\'/api/users\', require(\'./routes/user.routes\'));');
appJs = appJs.replace('// app.use(\'/api/notes\', require(\'./routes/note.routes\'));', 'app.use(\'/api/notes\', require(\'./routes/note.routes\'));');
appJs = appJs.replace('// app.use(\'/api/flashcards\', require(\'./routes/flashcard.routes\'));', 'app.use(\'/api/flashcards\', require(\'./routes/flashcard.routes\'));');
appJs += `
// Additional routes added
app.use('/api/quizzes', require('./routes/quiz.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/books', require('./routes/book.routes'));
app.use('/api/uploads', require('./routes/upload.routes'));
`;
fs.writeFileSync(appJsPath, appJs);
console.log('Routes scaffolding complete.');
