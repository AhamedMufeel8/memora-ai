require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { ensureUploadDir } = require('./middleware/upload');

const PORT = process.env.PORT || 5000;

ensureUploadDir();

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log('Server running on port ', PORT);
    });
  })
  .catch(err => {
    console.error('Database connection failed', err);
  });
