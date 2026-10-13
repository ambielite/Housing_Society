
const express = require("express");

const router = express.Router();

const moderationController =
    require("./moderation.controller");


// Create moderation report
router.post(
    "/",
    moderationController.createModerationReport
);


// Get moderation reports
router.get(
    "/",
    moderationController.getModerationReports
);


// Get moderation report by ID
router.get(
    "/:id",
    moderationController.getModerationById
);


// Start moderation review
router.post(
    "/:id/review",
    moderationController.startReview
);


// Apply moderation action
router.post(
    "/:id/action",
    moderationController.applyAction
);


// Resolve report
router.post(
    "/:id/resolve",
    moderationController.resolveReport
);


// Dismiss report
router.post(
    "/:id/dismiss",
    moderationController.dismissReport
);


// Delete report
router.delete(
    "/:id",
    moderationController.deleteModeration
);


module.exports = router;

