const express = require("express");

const router = express.Router();

const controller =
    require("./financialClearance.controller");

const validation =
    require("./financialClearance.validation");


router.post(
    "/",
    validation.validateCreate,
    controller.createFinancialClearance
);


router.get(
    "/",
    controller.getFinancialClearances
);


router.get(
    "/pending",
    controller.getPendingClearances
);


router.get(
    "/lifecycle/:lifecycleId",
    validation.validateLifecycleId,
    controller.getClearancesByLifecycle
);


router.get(
    "/:id",
    validation.validateId,
    controller.getFinancialClearance
);


router.post(
    "/:id/clear",
    validation.validateId,
    validation.validateClear,
    controller.clearFinancialClearance
);


router.post(
    "/:id/hold",
    validation.validateId,
    validation.validateHold,
    controller.putOnHold
);


router.put(
    "/:id/outstanding-amount",
    validation.validateId,
    validation.validateOutstandingAmount,
    controller.updateOutstandingAmount
);


router.delete(
    "/:id",
    validation.validateId,
    controller.deleteFinancialClearance
);


module.exports = router;