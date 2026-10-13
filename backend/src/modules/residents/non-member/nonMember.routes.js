const express = require("express");

const controller = require("./nonMember.controller");

const {
    validateCreate,
    validateUpdate,
    validateStatus,
    validateId
} = require("./nonMember.validation");

const router = express.Router();

// Create
router.post(
    "/",
    validateCreate,
    controller.create
);

// Get all / filter
router.get(
    "/",
    controller.getAll
);

// Get all members of society
router.get(
    "/society/:societyId",
    controller.getBySociety
);

// Search
router.get(
    "/society/:societyId/search",
    controller.search
);

// Get by ID
router.get(
    "/:id",
    validateId,
    controller.getById
);

// Update
router.patch(
    "/:id",
    validateId,
    validateUpdate,
    controller.update
);

// Approve
router.patch(
    "/:id/approve",
    validateId,
    controller.approve
);

// Status
router.patch(
    "/:id/status",
    validateId,
    validateStatus,
    controller.updateStatus
);

// Delete
router.delete(
    "/:id",
    validateId,
    controller.remove
);

module.exports = router;