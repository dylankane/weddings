'use strict';

const multer = require('multer');
const path = require('path');

const MAX_SIZE_MB = parseInt(process.env.UPLOAD_MAX_SIZE_MB || 10) * 1024 * 1024;

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'public', 'uploads'),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${timestamp}-${safeName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE_MB } });

module.exports = upload;
