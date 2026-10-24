const express = require("express");
const multer = require("multer");
const path = require("node:path");
const ApiError = require("../../../common/ApiError");

const router = express.Router();

const controller =
    require("./agreement.controller");

const validation =
    require("./agreement.validation");

const allowedDocumentTypes = {
    ".pdf": new Set(["application/pdf"]),
    ".png": new Set(["image/png"]),
    ".jpg": new Set(["image/jpeg"]),
    ".jpeg": new Set(["image/jpeg"]),
    ".doc": new Set(["application/msword", "application/octet-stream"]),
    ".docx": new Set([
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/octet-stream"
    ])
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024, files: 2 },
    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!allowedDocumentTypes[extension]?.has(file.mimetype)) {
            return callback(new ApiError(400, "Upload a PDF, PNG, JPG, DOC or DOCX document."));
        }
        callback(null, true);
    }
});

const uploadAgreementDocuments = (req, res, next) => {
    upload.fields([
        { name: "agreementDocument", maxCount: 1 },
        { name: "signedAgreementCopy", maxCount: 1 }
    ])(req, res, (error) => {
        if (!error) return next();
        if (error instanceof multer.MulterError) {
            return next(new ApiError(400, error.message));
        }
        next(error);
    });
};


router.post(
    "/",
    uploadAgreementDocuments,
    validation.validateCreate,
    controller.createAgreement
);


router.get(
    "/",
    controller.getAgreements
);


router.get(
    "/reference/:reference",
    controller.getAgreementByReference
);


router.get(
    "/unit/:unitId",
    validation.validateUUIDParam(
        "unitId",
        "Invalid unitId"
    ),
    controller.getAgreementsByUnit
);


router.get(
    "/tenant/:tenantId",
    validation.validateUUIDParam(
        "tenantId",
        "Invalid tenantId"
    ),
    controller.getAgreementsByTenant
);


router.get(
    "/owner/:ownerId",
    validation.validateUUIDParam(
        "ownerId",
        "Invalid ownerId"
    ),
    controller.getAgreementsByOwner
);


router.get(
    "/:id/documents/:documentType",
    validation.validateId,
    controller.getAgreementDocument
);

router.get(
    "/:id",
    validation.validateId,
    controller.getAgreement
);


router.put(
    "/:id",
    validation.validateId,
    uploadAgreementDocuments,
    controller.updateAgreement
);


router.post(
    "/:id/submit",
    validation.validateId,
    controller.submitAgreement
);


router.post(
    "/:id/verify",
    validation.validateId,
    controller.startVerification
);


router.post(
    "/:id/approve",
    validation.validateId,
    controller.approveAgreement
);


router.post(
    "/:id/reject",
    validation.validateId,
    validation.validateRemarks,
    controller.rejectAgreement
);


router.post(
    "/:id/activate",
    validation.validateId,
    controller.activateAgreement
);


router.post(
    "/:id/expiring-soon",
    validation.validateId,
    controller.markExpiringSoon
);


router.post(
    "/:id/expired",
    validation.validateId,
    controller.markExpired
);


router.post(
    "/:id/terminate",
    validation.validateId,
    validation.validateRemarks,
    controller.terminateAgreement
);


router.delete(
    "/:id",
    validation.validateId,
    controller.deleteAgreement
);


module.exports = router;
