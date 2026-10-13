const express = require("express");

const router = express.Router();

const controller = require("./journal.controller");

// Create Journal Draft
router.post(
    "/draft",
    controller.createDraftJournal
);

// Get all journals
router.get(
    "/",
    controller.getAll
);

// Get journals by accounting period
router.get(
    "/period/:accountingPeriodId",
    controller.getByPeriod
);

// Get journals by society and status
router.get(
    "/society/:societyId/status/:status",
    controller.getByStatus
);

// Get journal by ID
router.get(
    "/:id",
    controller.getById
);

// Delete draft journal
router.delete(
    "/:id",
    controller.removeDraft
);

module.exports = router;