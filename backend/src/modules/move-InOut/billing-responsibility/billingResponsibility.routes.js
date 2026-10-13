const express = require("express");

const router = express.Router();

const controller =
    require("./billingResponsibility.controller");

const validation =
    require("./billingResponsibility.validation");


// Create billing responsibility
router.post(
    "/",
    validation.validateCreateBillingResponsibility,
    controller.createBillingResponsibility
);


// Get all
router.get(
    "/",
    controller.getBillingResponsibilities
);


// Current responsibility by unit
// Keep before /:id
router.get(
    "/unit/:unitId/current",
    validation.validateUnitId,
    controller.getCurrentByUnit
);


// Responsibility history by unit
router.get(
    "/unit/:unitId",
    validation.validateUnitId,
    controller.getHistoryByUnit
);


// Current responsibility by resident
router.get(
    "/resident/:residentId/current",
    validation.validateResidentId,
    controller.getCurrentByResident
);


// Responsibility history by resident
router.get(
    "/resident/:residentId",
    validation.validateResidentId,
    controller.getHistoryByResident
);


// Transfer responsibility
router.post(
    "/transfer",
    validation.validateTransfer,
    controller.transferResponsibility
);


// Get by ID
router.get(
    "/:id",
    validation.validateId,
    controller.getBillingResponsibility
);


// Close responsibility
router.post(
    "/:id/close",
    validation.validateId,
    validation.validateClose,
    controller.closeResponsibility
);


// Update
router.put(
    "/:id",
    validation.validateId,
    validation.validateUpdate,
    controller.updateBillingResponsibility
);


// Delete
router.delete(
    "/:id",
    validation.validateId,
    controller.deleteBillingResponsibility
);


module.exports = router;