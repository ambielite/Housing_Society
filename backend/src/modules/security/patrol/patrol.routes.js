const express = require("express");

const router = express.Router();

const controller =
    require("./patrol.controller");


// Create patrol
router.post(
    "/",
    controller.createPatrol
);


// Get all patrols
router.get(
    "/",
    controller.getAllPatrols
);


// Get patrol checkpoints
router.get(
    "/:id/checkpoints",
    controller.getPatrolCheckpoints
);


// Add checkpoint to patrol
router.post(
    "/:id/checkpoints",
    controller.addCheckpointToPatrol
);


// Verify checkpoint
router.post(
    "/:id/checkpoints/:checkpointId/verify",
    controller.verifyCheckpoint
);


// Mark checkpoint missed
router.post(
    "/:id/checkpoints/:checkpointId/missed",
    controller.markCheckpointMissed
);


// Start patrol
router.post(
    "/:id/start",
    controller.startPatrol
);


// Complete patrol
router.post(
    "/:id/complete",
    controller.completePatrol
);


// Cancel patrol
router.post(
    "/:id/cancel",
    controller.cancelPatrol
);


// Get patrol
router.get(
    "/:id",
    controller.getPatrolById
);


// Update
router.put(
    "/:id",
    controller.updatePatrol
);


// Delete
router.delete(
    "/:id",
    controller.deletePatrol
);


module.exports = router;