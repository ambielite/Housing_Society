const express = require("express");
const multer = require("multer");
const path = require("path");
const ApiError = require("../../../common/ApiError");


const societyController =
    require("./society.controller");

const {
    validateSocietyCreate,
    validateSocietyUpdate,
    validateSocietyId,
    
} = require("./society.validation");


const router = express.Router();

const allowedLogos = new Map([
    ["image/jpeg", new Set([".jpg", ".jpeg"])],
    ["image/png", new Set([".png"])],
    ["image/webp", new Set([".webp"])],
]);
const logoUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!allowedLogos.get(file.mimetype)?.has(extension)) {
            return callback(new ApiError(400, "Society logo must be a JPG, PNG, or WEBP image."));
        }
        callback(null, true);
    },
});
const parseSocietyForm = (req, res, next) => logoUpload.single("logo")(req, res, (error) => {
    if (error instanceof multer.MulterError) return next(new ApiError(400, error.message));
    if (typeof req.body?.taxConfiguration === "string") {
        try {
            req.body.taxConfiguration = JSON.parse(req.body.taxConfiguration);
        } catch {
            return next(new ApiError(400, "Tax configuration must be valid JSON."));
        }
    }
    if (req.body?.removeLogo === "true") req.body.removeLogo = true;
    next(error);
});


/*
    CREATE SOCIETY

    POST /api/v1/admin/societies
*/
router.post(
    "/",
    parseSocietyForm,
    validateSocietyCreate,
    societyController.createSociety
);


/*
    GET ALL SOCIETIES

    GET /api/v1/admin/societies
*/
router.get(
    "/",
    societyController.getAllSocieties
);


/*
    GET SOCIETY BY ID

    GET /api/v1/admin/societies/:id
*/
router.get(
    "/:id",
    validateSocietyId,
    societyController.getSocietyById
);


/*
    UPDATE SOCIETY

    PUT /api/v1/admin/societies/:id
*/
router.put(
    "/:id",
    validateSocietyId,
    parseSocietyForm,
    validateSocietyUpdate,
    societyController.updateSociety
);

/*
    DELETE SOCIETY

    DELETE /api/v1/admin/societies/:id
*/
router.delete(
    "/:id",
    validateSocietyId,
    
    societyController.deleteSociety
);

module.exports = router;
