const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const STORAGE_ROOT = path.join(__dirname, "..", "..", "..", "..", "private_uploads", "resident-kyc");
fs.mkdirSync(STORAGE_ROOT, { recursive: true });

const checksum = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

const save = (file) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const storageKey = `${crypto.randomUUID()}${extension}`;
    fs.writeFileSync(path.join(STORAGE_ROOT, storageKey), file.buffer, { flag: "wx" });
    return storageKey;
};

const getPath = (storageKey) => {
    if (!/^[0-9a-f-]+\.(pdf|jpg|jpeg|png)$/i.test(storageKey || "")) {
        throw new Error("Invalid resident document reference");
    }
    return path.join(STORAGE_ROOT, storageKey);
};

const remove = (storageKey) => {
    const fullPath = getPath(storageKey);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
};

module.exports = { checksum, save, getPath, remove };
