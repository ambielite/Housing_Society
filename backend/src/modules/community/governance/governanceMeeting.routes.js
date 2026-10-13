
const express = require("express");

const router = express.Router();

const controller =
    require("./governanceMeeting.controller");


// Create AGM / SGM
router.post(
    "/",
    controller.createGovernanceMeeting
);


// Get all
router.get(
    "/",
    controller.getGovernanceMeetings
);


// Get by ID
router.get(
    "/:id",
    controller.getGovernanceMeetingById
);


// Update
router.put(
    "/:id",
    controller.updateGovernanceMeeting
);


// Publish notice
router.post(
    "/:id/publish-notice",
    controller.publishNotice
);


// Schedule
router.post(
    "/:id/schedule",
    controller.scheduleMeeting
);


// Start
router.post(
    "/:id/start",
    controller.startMeeting
);


// Update quorum
router.post(
    "/:id/quorum",
    controller.updateQuorum
);


// Complete
router.post(
    "/:id/complete",
    controller.completeMeeting
);


// Approve minutes
router.post(
    "/:id/approve-minutes",
    controller.approveMinutes
);


// Cancel
router.post(
    "/:id/cancel",
    controller.cancelMeeting
);


// Delete
router.delete(
    "/:id",
    controller.deleteGovernanceMeeting
);


module.exports = router;

