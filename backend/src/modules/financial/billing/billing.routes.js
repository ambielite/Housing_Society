const express =
    require("express");

const router =
    express.Router();

const controller =
    require("./billing.controller");

const {
    validateCreateBilling,
    validateBillingCalculation
} =
    require("./billing.validation");


// =====================================================
// CREATE BILL
// =====================================================

router.post(
    "/",
    validateCreateBilling,
    controller.create
);


// =====================================================
// GET ALL
// =====================================================

router.get(
    "/",
    controller.getAll
);


// =====================================================
// CALCULATE BILL
// =====================================================

router.post(
    "/calculate",
    validateBillingCalculation,
    controller.calculate
);


// =====================================================
// UPDATE OVERDUE
// =====================================================

router.post(
    "/update-overdue",
    controller.updateOverdue
);


// =====================================================
// GET BILLINGS BY UNIT
// IMPORTANT: Keep this before /:id
// =====================================================

router.get(
    "/unit/:societyId/:unitId",
    controller.getByUnit
);


// =====================================================
// GET BILLING BY ID
// =====================================================

router.get(
    "/:id",
    controller.getById
);


// =====================================================
// ISSUE
// =====================================================

router.post(
    "/:id/issue",
    controller.issue
);


// =====================================================
// CANCEL
// =====================================================

router.post(
    "/:id/cancel",
    controller.cancel
);


// =====================================================
// DELETE
// =====================================================

router.delete(
    "/:id",
    controller.remove
);


module.exports = router;