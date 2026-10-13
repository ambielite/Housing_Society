const express = require("express");

const router = express.Router();

const controller = require("./occupancy.controller");

const validation = require("./occupancy.validation");


router.post(
    "/",
    validation.validateCreateOccupancy,
    controller.createOccupancy
);


router.get(
    "/",
    controller.getOccupancies
);


router.get(
    "/unit/:unitId/current",
    validation.validateUnitId,
    controller.getCurrentOccupancyByUnit
);


router.get(
    "/unit/:unitId",
    validation.validateUnitId,
    controller.getOccupancyHistoryByUnit
);


router.get(
    "/resident/:residentId",
    validation.validateResidentId,
    controller.getOccupancyHistoryByResident
);


router.get(
    "/:id",
    validation.validateOccupancyId,
    controller.getOccupancy
);


router.post(
    "/transfer",
    validation.validateTransferOccupancy,
    controller.transferOccupancy
);


router.post(
    "/:id/close",
    validation.validateOccupancyId,
    validation.validateCloseOccupancy,
    controller.closeOccupancy
);


module.exports = router;