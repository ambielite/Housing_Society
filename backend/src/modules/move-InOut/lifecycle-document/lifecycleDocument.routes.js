const express = require("express");

const router = express.Router();

const controller =
    require("./lifecycleDocument.controller");

const validation =
    require("./lifecycleDocument.validation");


// Create document
router.post(
    "/",
    validation.validateCreateDocument,
    controller.createDocument
);


// Get all documents
router.get(
    "/",
    controller.getDocuments
);


// Get pending documents
// Keep this BEFORE /:id
router.get(
    "/pending",
    controller.getPendingDocuments
);


// Get documents for a lifecycle
router.get(
    "/lifecycle/:lifecycleType/:lifecycleId",
    validation.validateLifecycle,
    controller.getDocumentsByLifecycle
);


// Get document by ID
router.get(
    "/:id",
    validation.validateDocumentId,
    controller.getDocument
);


// Verify document
router.post(
    "/:id/verify",
    validation.validateDocumentId,
    validation.validateVerification,
    controller.verifyDocument
);


// Reject document
router.post(
    "/:id/reject",
    validation.validateDocumentId,
    validation.validateRejection,
    controller.rejectDocument
);


// Delete document
router.delete(
    "/:id",
    validation.validateDocumentId,
    controller.deleteDocument
);

module.exports = router;