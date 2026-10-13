const express = require("express");

const router = express.Router();

const controller =
    require("./meeting.controller");

router.post(
    "/",
    controller.createMeeting
);

router.get(
    "/",
    controller.getMeetings
);

router.get(
    "/:id",
    controller.getMeetingById
);

router.put(
    "/:id",
    controller.updateMeeting
);

router.post(
    "/:id/submit",
    controller.submitForApproval
);

router.post(
    "/:id/approve",
    controller.approveMeeting
);

router.post(
    "/:id/schedule",
    controller.scheduleMeeting
);

router.post(
    "/:id/start",
    controller.startMeeting
);

router.post(
    "/:id/complete",
    controller.completeMeeting
);

router.post(
    "/:id/cancel",
    controller.cancelMeeting
);

router.delete(
    "/:id",
    controller.deleteMeeting
);

module.exports = router;