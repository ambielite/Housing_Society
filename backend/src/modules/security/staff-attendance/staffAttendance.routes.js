const express = require("express");

const router =
    express.Router();

const controller =
    require("./staffAttendance.controller");


router.post(
    "/",
    controller.createAttendance
);

router.get(
    "/",
    controller.getAllAttendance
);

router.get(
    "/staff/:staffId",
    controller.getAttendanceByStaff
);

router.post(
    "/check-in",
    controller.checkIn
);

router.post(
    "/check-out",
    controller.checkOut
);

router.post(
    "/mark-absent",
    controller.markAbsent
);

router.post(
    "/mark-leave",
    controller.markLeave
);

router.get(
    "/:id",
    controller.getAttendanceById
);

router.put(
    "/:id",
    controller.updateAttendance
);

router.delete(
    "/:id",
    controller.deleteAttendance
);


module.exports = router;