
const express = require("express");

const router = express.Router();

const broadcastController =
    require("./broadcast.controller");


// ============================================================
// CREATE
// ============================================================

router.post(
    "/",
    broadcastController.createBroadcast
);


// ============================================================
// GET ALL
// ============================================================

router.get(
    "/",
    broadcastController.getAllBroadcasts
);


// ============================================================
// GET BY ID
// ============================================================

router.get(
    "/:id",
    broadcastController.getBroadcastById
);


// ============================================================
// UPDATE
// ============================================================

router.put(
    "/:id",
    broadcastController.updateBroadcast
);


// ============================================================
// SCHEDULE
// ============================================================

router.post(
    "/:id/schedule",
    broadcastController.scheduleBroadcast
);


// ============================================================
// START
// ============================================================

router.post(
    "/:id/start",
    broadcastController.startBroadcast
);


// ============================================================
// MARK SENT
// ============================================================

router.post(
    "/:id/sent",
    broadcastController.markAsSent
);


// ============================================================
// CANCEL
// ============================================================

router.post(
    "/:id/cancel",
    broadcastController.cancelBroadcast
);


// ============================================================
// DELETE
// ============================================================

router.delete(
    "/:id",
    broadcastController.deleteBroadcast
);


module.exports = router;

