const express = require("express");

const router = express.Router();

const controller = require("./residentKyc.controller");

const {
    validateCreateKyc,
    validateUpdateKyc,
    validateId
} = require("./residentKyc.validation");


// Create KYC document
router.post(
    "/",
    validateCreateKyc,
    controller.createDocument
);


// Get document by ID
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