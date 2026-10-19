const express = require("express");
const multer = require("multer");
const path = require("node:path");
const ApiError = require("../../../common/ApiError");

const router = express.Router();

const controller = require("./moveIn.controller");

const validation = require("./moveIn.validation");

const allowedDocumentTypes = {
    ".pdf": new Set(["application/pdf"]),
    ".png": new Set(["image/png"]),
    ".jpg": new Set(["image/jpeg"]),
    ".jpeg": new Set(["image/jpeg"]),
    ".doc": new Set(["application/msword", "application/octet-stream"]),
    ".docx": new Set(["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"])
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024, files: 3 },
    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!allowedDocumentTypes[extension]?.has(file.mimetype)) {
            return callback(new ApiError(400, "Upload a PDF, PNG, JPG, DOC or DOCX document."));
        }
        callback(null, true);
    }
});

const uploadMoveInDocuments = (req, res, next) => {
    upload.fields([
        { name: "leaseDocument", maxCount: 1 },
        { name: "registryDocument", maxCount: 1 },
        { name: "policeVerificationDocument", maxCount: 1 }
    ])(req, res, (error) => {
        if (!error) return next();
        if (error instanceof multer.MulterError) return next(new ApiError(400, error.message));
        next(error);
    });
};

router.post(
    "/",
    uploadMoveInDocuments,
    validation.validateCreateMoveIn,
    controller.createMoveIn
);

router.get(
    "/",
    controller.getMoveIns
);

router.get(
    "/:id",
    validation.validateMoveInId,
    controller.getMoveIn
);

router.put(
    "/:id",
    validation.validateMoveInId,
    uploadMoveInDocuments,
    validation.validateUpdateMoveIn,
    controller.updateMoveIn
);

router.post(
    "/:id/submit-documents",
    validation.validateMoveInId,
    controller.submitDocuments
);

router.post(
    "/:id/request-information",
    validation.validateMoveInId,
    controller.requestInformation
);

router.post(
    "/:id/verify",
    validation.validateMoveInId,
    controller.startVerification
);

router.post(
    "/:id/approve",
    validation.validateMoveInId,
    validation.validateApproval,
    controller.approveMoveIn
);

router.post(
    "/:id/reject",
    validation.validateMoveInId,
    validation.validateRejection,
    controller.rejectMoveIn
);

router.post(
    "/:id/issue-gate-pass",
    validation.validateMoveInId,
    controller.issueGatePass
);

router.post(
    "/:id/ledger-created",
    validation.validateMoveInId,
    controller.markLedgerCreated
);

router.post(
    "/:id/activate-access",
    validation.validateMoveInId,
    controller.activateAccess
);

router.post(
    "/:id/complete",
    validation.validateMoveInId,
    controller.completeMoveIn
);

router.delete(
    "/:id",
    validation.validateMoveInId,
    controller.deleteMoveIn
);

module.exports = router;
