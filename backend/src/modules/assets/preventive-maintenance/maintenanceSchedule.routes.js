
const express = require("express");

const router = express.Router();

const controller =
    require("./maintenanceSchedule.controller");


router.post(
    "/",
    controller.createSchedule
);


router.get(
    "/",
    controller.getAllSchedules
);


router.get(
    "/asset/:assetId",
    controller.getSchedulesByAssetId
);


router.get(
    "/:id",
    controller.getScheduleById
);


router.put(
    "/:id",
    controller.updateSchedule
);


router.post(
    "/:id/pause",
    controller.pauseSchedule
);


router.post(
    "/:id/activate",
    controller.activateSchedule
);


router.post(
    "/:id/complete",
    controller.completeSchedule
);


router.post(
    "/:id/cancel",
    controller.cancelSchedule
);


router.post(
    "/:id/update-next-due",
    controller.updateNextDueDate
);


router.delete(
    "/:id",
    controller.deleteSchedule
);


module.exports = router;

