const express = require("express");

const router = express.Router();

const controller =
    require("./meetingAttendance.controller");

router.post(
    "/",
    controller.markAttendance
);

router.get(
    "/",
    controller.getAttendance
);

router.get(
    "/:id",
    controller.getAttendanceById
);

router.post(
    "/:id/check-out",
    controller.checkOut
);

router.delete(
    "/:id",
    controller.deleteAttendance
);

module.exports = router;