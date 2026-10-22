const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Match the /uploads static root configured by the Express application.
const UPLOAD_DIRECTORY = path.join(process.cwd(), 'uploads', 'profile-pictures');

const saveProfilePicture = (file) => {
  fs.mkdirSync(UPLOAD_DIRECTORY, { recursive: true });
  const extension = path.extname(file.originalname).toLowerCase();
  const filename = `${crypto.randomUUID()}${extension}`;
  fs.writeFileSync(path.join(UPLOAD_DIRECTORY, filename), file.buffer);
  return `/uploads/profile-pictures/${filename}`;
};

const removeProfilePicture = (url) => {
  if (!url || !url.startsWith('/uploads/profile-pictures/')) return;
  const filename = path.basename(url);
  const filePath = path.join(UPLOAD_DIRECTORY, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

module.exports = { saveProfilePicture, removeProfilePicture };
