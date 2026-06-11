'use strict';

const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');

// Saves a multer file object to local disk and returns the public URL path.
// When R2 is added, swap this function's internals — all callers use the returned path string.
async function saveFile(file) {
  const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
  const destPath = path.join(UPLOAD_DIR, filename);

  await fs.promises.rename(file.path, destPath);

  return `/uploads/${filename}`;
}

async function deleteFile(urlPath) {
  if (!urlPath || !urlPath.startsWith('/uploads/')) return;

  const filename = path.basename(urlPath);
  const filePath = path.join(UPLOAD_DIR, filename);

  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

module.exports = { saveFile, deleteFile };
