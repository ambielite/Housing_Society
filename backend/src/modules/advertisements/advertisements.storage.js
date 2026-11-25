const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIRECTORY = path.join(process.cwd(), 'uploads', 'advertisements');
const EXTENSIONS = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
]);

const saveImage = (file) => {
  if (!file?.buffer || !EXTENSIONS.has(file.mimetype)) throw new Error('Choose a JPG, PNG, WEBP, or GIF image.');
  fs.mkdirSync(UPLOAD_DIRECTORY, { recursive: true });
  const filename = `${crypto.randomUUID()}${EXTENSIONS.get(file.mimetype)}`;
  fs.writeFileSync(path.join(UPLOAD_DIRECTORY, filename), file.buffer);
  return `/uploads/advertisements/${filename}`;
};

const removeImage = (url) => {
  if (!url?.startsWith('/uploads/advertisements/')) return;
  const filename = path.basename(url);
  const target = path.join(UPLOAD_DIRECTORY, filename);
  if (fs.existsSync(target)) fs.unlinkSync(target);
};

module.exports = { saveImage, removeImage };
