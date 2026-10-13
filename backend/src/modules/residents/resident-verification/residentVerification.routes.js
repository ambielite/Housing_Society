const express = require("express");

const controller = require("./residentVerification.controller");

const {
    validateCreateVerification,
    validateReview,
    validateStatusUpdate,
    validateId
} = require("./residentVerification.validation");

const router = express.Router();

// Create verification request
router.post(
    "/",
    validateCreateVerification,
    controller.create
);

// Get all verification requests
router.get(
    "/",
    controller.getAll
);

// Verification queue
router.get(
    "/pending",
    controller.getPendingQueue
);

// Get verification history for resident
router.get(
    "/resident/:residentId",
    controller.getResidentVerifications
);

// Get single verification
router.get(
    "/:id",
    validateId,
    controller.getById
);

// Approve
router.patch(
    "/:id/approve",
    validateId,
    controller.approve
);

// Reject
router.patch(
    "/:id/reject",
    validateId,
    controller.reject
);

// Request more information
router.patch(
    "/:id/request-information",
    validateId,
    controller.requestInformation
);

// Change stakeholder lifecycle status
router.patch(
    "/resident/:residentId/status",
    validateStatusUpdate,
    controller.updateStatus
);

// Delete verification
router.delete(
    "/:id",
    validateId,
    controller.remove
);

module.exports = router;