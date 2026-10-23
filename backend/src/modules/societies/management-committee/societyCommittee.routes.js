const express = require("express");
const multer = require("multer");
const path = require("path");
const ApiError = require("../../../common/ApiError");
const controller = require("./societyCommittee.controller");
const { validateMember } = require("./societyCommittee.validation");

const router = express.Router();
const allowedProfileImages = new Map([
  ["image/jpeg", new Set([".jpg", ".jpeg"])],
  ["image/png", new Set([".png"])],
  ["image/webp", new Set([".webp"])],
]);
const profilePictureUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedProfileImages.get(file.mimetype)?.has(extension)) {
      return callback(new ApiError(400, "Profile picture must be a JPG, PNG, or WEBP image."));
    }
    callback(null, true);
  },
});
const parseMultipart = (req, res, next) => {
  profilePictureUpload.single("profilePicture")(req, res, (error) => {
    if (error instanceof multer.MulterError) return next(new ApiError(400, error.message));
    if (req.body?.isActive === "true") req.body.isActive = true;
    if (req.body?.isActive === "false") req.body.isActive = false;
    next(error);
  });
};

router.get("/", controller.list);
router.post("/", parseMultipart, validateMember, controller.create);
router.put("/:id", parseMultipart, validateMember, controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
