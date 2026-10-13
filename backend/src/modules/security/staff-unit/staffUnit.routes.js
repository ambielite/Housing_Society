const express = require("express");

const router =
    express.Router();

const controller =
    require("./staffUnit.controller");


router.post(
    "/",
    controller.createAssignment
);


router.get(
    "/",
    controller.getAllAssignments
);


router.get(
    "/staff/:staffId",
    controller.getAssignmentsByStaff
);


router.get(
    "/unit/:unitId",
    controller.getAssignmentsByUnit
);


router.get(
    "/:id",
    controller.getAssignmentById
);


router.put(
    "/:id",
    controller.updateAssignment
);


router.post(
    "/:id/activate",
    controller.activateAssignment
);


router.post(
    "/:id/deactivate",
    controller.deactivateAssignment
);


router.post(
    "/:id/complete",
    controller.completeAssignment
);


router.delete(
    "/:id",
    controller.deleteAssignment
);


module.exports = router;