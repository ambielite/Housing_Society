const express = require("express");
const multer = require("multer");

const controller =
    require("./staff.controller");

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
        if (!allowed.has(file.mimetype)) {
            return callback(new Error("Profile picture must be JPG, PNG, or WEBP"));
        }
        callback(null, true);
    }
});
const uploadProfilePicture = (req, res, next) => {
    upload.single("profilePicture")(req, res, (error) => {
        if (error) return res.status(400).json({ success: false, message: error.message });
        next();
    });
};


router.post(
    "/",
    uploadProfilePicture,
    controller.createStaff
);


router.get(
    "/",
    controller.getAllStaff
);


router.get(
    "/:id",
    controller.getStaffById
);


router.put(
    "/:id",
    uploadProfilePicture,
    controller.updateStaff
);


router.post(
    "/:id/activate",
    controller.activateStaff
);


router.post(
    "/:id/deactivate",
    controller.deactivateStaff
);


router.delete(
    "/:id",
    controller.deleteStaff
);


module.exports = router;
