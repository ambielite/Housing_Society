const express = require("express");

const controller =
    require("./staff.controller");

const router = express.Router();


router.post(
    "/",
    controller.createStaff
);


router.get(
    "/",
    controller.getAllStaff
);


router.get(
    "/:id",
    controller.getStaffById
);


router.put(
    "/:id",
    controller.updateStaff
);


router.post(
    "/:id/activate",
    controller.activateStaff
);


router.post(
    "/:id/deactivate",
    controller.deactivateStaff
);


router.delete(
    "/:id",
    controller.deleteStaff
);


module.exports = router;