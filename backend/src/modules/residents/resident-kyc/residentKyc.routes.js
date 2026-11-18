const express = require("express");
const multer = require("multer");
const path = require("path");
const ApiError = require("../../../common/ApiError");

const router = express.Router();

const allowedDocuments = new Map([
    ["application/pdf", new Set([".pdf"])],
    ["image/jpeg", new Set([".jpg", ".jpeg"])],
    ["image/png", new Set([".png"])]
]);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!allowedDocuments.get(file.mimetype)?.has(extension)) {
            return callback(new ApiError(400, "Document must be a PDF, JPG, or PNG file."));
        }
        callback(null, true);
    }
});
const parseDocumentFile = (req, res, next) => upload.single("file")(req, res, (error) => {
    if (error instanceof multer.MulterError) return next(new ApiError(400, error.message));
    next(error);
});

const controller = require("./residentKyc.controller");

const {
    validateCreateKyc,
    validateUpdateKyc,
    validateId
} = require("./residentKyc.validation");


// Create KYC document
router.post(
    "/",
    parseDocumentFile,
    validateCreateKyc,
    controller.createDocument
);


// Get document by ID
router.get(
    "/:id/file",
    validateId,
    controller.downloadDocument
);

router.get(
    "/:id",
    validateId,
    controller.getDocument
);


// Get documents of stakeholder
router.get(
    "/stakeholder/:stakeholderId",
    controller.getStakeholderDocuments
);


// Get all society KYC documents
router.get(
    "/society/:societyId",
    controller.getSocietyDocuments
);


// Get pending verification documents
router.get(
    "/society/:societyId/pending",
    controller.getPendingDocuments
);


// Get expiring documents
router.get(
    "/expiring/list",
    controller.getExpiringDocuments
);


// Update document
router.patch(
    "/:id",
    validateId,
    validateUpdateKyc,
    controller.updateDocument
);


// Verify document
router.patch(
    "/:id/verify",
    validateId,
    controller.verifyDocument
);


// Reject document
router.patch(
    "/:id/reject",
    validateId,
    controller.rejectDocument
);


// Request more information
router.patch(
    "/:id/request-information",
    validateId,
    controller.requestMoreInformation
);


// Archive document
router.delete(
    "/:id",
    validateId,
    controller.archiveDocument
);


module.exports = router;
