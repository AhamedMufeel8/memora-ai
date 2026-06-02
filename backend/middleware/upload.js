const multer = require('multer');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    const safeBaseName = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80) || 'document';

    cb(null, `${Date.now()}-${safeBaseName}.pdf`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['application/pdf', 'application/x-pdf', 'application/octet-stream'];
  const isPdfMime = allowedMimeTypes.includes(file.mimetype);
  const isPdfExtension = path.extname(file.originalname).toLowerCase() === '.pdf';

  if (isPdfExtension && isPdfMime) {
    return cb(null, true);
  }

  const error = new Error('Only PDF files are allowed');
  error.statusCode = 400;
  return cb(error);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

module.exports = {
  upload,
  ensureUploadDir,
  MAX_FILE_SIZE,
};
