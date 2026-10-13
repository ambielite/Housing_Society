const express = require("express");

const router = express.Router();

const controller =
    require("./gatePass.controller");

const validation =
    require("./gatePass.validation");


// Create gate pass
router.post(
    "/",
    validation.validateCreateGatePass,
    controller.createGatePass
);


// Get all gate passes
router.get(
    "/",
    controller.getGatePasses
);


// Get active gate passes
// Must come before /:id
router.get(
    "/active",
    controller.getActiveGatePasses
);


// Find gate pass by pass code
router.get(
    "/code/:passCode",
    validation.validatePassCode,
    controller.getGatePassByCode
);


// Get passes for lifecycle
router.get(
    "/lifecycle/:lifecycleType/:lifecycleId",
    controller.getGatePassesByLifecycle
);


// Get gate pass by ID
router.get(
    "/:id",
    validation.validateGatePassId,
    controller.getGatePass
);


// Verify gate pass
router.post(
    "/:id/verify",
    validation.validateGatePassId,
    validation.validateVerification,
    controller.verifyGatePass
);


// Use gate pass
router.post(
    "/:id/use",
    validation.validateGatePassId,
    controller.useGatePass
);


// Cancel gate pass
router.post(
    "/:id/cancel",
    validation.validateGatePassId,
    controller.cancelGatePass
);


// Delete gate pass
router.delete(
    "/:id",
    validation.validateGatePassId,
    controller.deleteGatePass
);


module.exports = router;