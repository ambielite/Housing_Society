const express = require("express");
const multer = require("multer");
const path = require("path");
const ApiError = require("../../../common/ApiError");

const router = express.Router();

const residentController =
    require("./resident.controller");

const allowedImages = new Map([["image/jpeg", new Set([".jpg", ".jpeg"])], ["image/png", new Set([".png"])], ["image/webp", new Set([".webp"])]]);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 }, fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedImages.get(file.mimetype)?.has(extension)) return callback(new ApiError(400, "Profile picture must be a JPG, PNG, or WEBP image."));
    callback(null, true);
} });
const parseProfilePicture = (req, res, next) => upload.single("profilePicture")(req, res, (error) => {
    if (error instanceof multer.MulterError) return next(new ApiError(400, error.message));
    if (req.body?.directoryPhoneVisible === "true") req.body.directoryPhoneVisible = true;
    if (req.body?.directoryPhoneVisible === "false") req.body.directoryPhoneVisible = false;
    for (const key of ["middleName", "email", "alternateMobile", "emergencyContactName", "emergencyContactMobile", "emergencyContactRelation", "remarks"]) {
        if (req.body?.[key] === "") req.body[key] = null;
    }
    next(error);
});


// CREATE
router.post(
    "/",
    parseProfilePicture,
    residentController.createResident
);


// GET ALL
router.get(
    "/",
    residentController.getAllResidents
);


// GET BY ID
router.get(
    "/:id",
    residentController.getResidentById
);


// UPDATE
router.put(
    "/:id",
    parseProfilePicture,
    residentController.updateResident
);


// CHANGE STATUS
router.patch(
    "/:id/status",
    residentController.changeResidentStatus
);


// DELETE
router.delete(
    "/:id",
    residentController.deleteResident
);


module.exports = router;
