const express = require("express");

const router =
    express.Router();

const controller =
    require("./shift.controller");


router.post(
    "/",
    controller.createShift
);


router.get(
    "/",
    controller.getAllShifts
);


router.get(
    "/:id",
    controller.getShiftById
);


router.put(
    "/:id",
    controller.updateShift
);


router.post(
    "/:id/activate",
    controller.activateShift
);


router.post(
    "/:id/deactivate",
    controller.deactivateShift
);


router.delete(
    "/:id",
    controller.deleteShift
);


module.exports = router;