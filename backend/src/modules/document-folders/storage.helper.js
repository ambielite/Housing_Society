const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// All uploaded files live under this directory, outside the DB. Only a
// relative "storage_key" is stored in the documents/document_versions
// tables, matching the doc's own convention ("Files should be stored
// outside the relational database").
const UPLOAD_ROOT = path.join(__dirname, '..', '..', '..', 'uploads', 'documents');

if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

const computeChecksum = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

/**
 * Saves a multer file buffer to disk under a random, collision-proof
 * name (never trusts the original filename for the path), returning
 * the relative storage_key to persist in the database.
 */
const saveFile = (fileBuffer, originalName) => {
  const ext = path.extname(originalName || '').slice(0, 10);
  const storageKey = `${crypto.randomUUID()}${ext}`;
  const fullPath = path.join(UPLOAD_ROOT, storageKey);
  fs.writeFileSync(fullPath, fileBuffer);
  return storageKey;
};

const getFullPath = (storageKey) => path.join(UPLOAD_ROOT, storageKey);

const deleteFile = (storageKey) => {
  const fullPath = getFullPath(storageKey);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

module.exports = { computeChecksum, saveFile, getFullPath, deleteFile, UPLOAD_ROOT };
