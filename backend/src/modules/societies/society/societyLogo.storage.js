const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const UPLOAD_DIRECTORY = path.join(process.cwd(), "uploads", "society-logos");

const saveSocietyLogo = (file) => {
    fs.mkdirSync(UPLOAD_DIRECTORY, { recursive: true });
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `${crypto.randomUUID()}${extension}`;
    fs.writeFileSync(path.join(UPLOAD_DIRECTORY, filename), file.buffer);
    return `/uploads/society-logos/${filename}`;
};

const removeSocietyLogo = (url) => {
    if (!url || !url.startsWith("/uploads/society-logos/")) return;
    const filename = path.basename(url);
    const filePath = path.join(UPLOAD_DIRECTORY, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

module.exports = { saveSocietyLogo, removeSocietyLogo };
