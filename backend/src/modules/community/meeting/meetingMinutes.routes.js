const express = require("express");

const router = express.Router();

const controller =
    require("./meetingMinutes.controller");

router.post(
    "/",
    controller.createMinutes
);

router.get(
    "/meeting/:meetingId",
    controller.getMinutes
);

router.put(
    "/:id",
    controller.updateMinutes
);

router.post(
    "/:id/submit",
    controller.submitMinutes
);

router.post(
    "/:id/approve",
    controller.approveMinutes
);

router.post(
    "/:id/reject",
    controller.rejectMinutes
);

router.delete(
    "/:id",
    controller.deleteMinutes
);

module.exports = router;