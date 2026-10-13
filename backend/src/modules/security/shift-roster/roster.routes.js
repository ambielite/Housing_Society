const express = require("express");

const router =
    express.Router();

const controller =
    require("./roster.controller");


router.post(
    "/",
    controller.createRoster
);


router.get(
    "/",
    controller.getAllRosters
);


router.get(
    "/staff/:staffId",
    controller.getRostersByStaff
);


router.get(
    "/date/:date",
    controller.getRostersByDate
);


router.post(
    "/:id/confirm",
    controller.confirmRoster
);


router.post(
    "/:id/cancel",
    controller.cancelRoster
);


router.post(
    "/:id/complete",
    controller.completeRoster
);


router.get(
    "/:id",
    controller.getRosterById
);


router.put(
    "/:id",
    controller.updateRoster
);


router.delete(
    "/:id",
    controller.deleteRoster
);


module.exports = router;