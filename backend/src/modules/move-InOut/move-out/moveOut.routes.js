const express = require("express");

const router = express.Router();

const controller = require("./moveOut.controller");

const validation = require("./moveOut.validation");

router.post(
    "/",
    validation.validateCreateMoveOut,
    controller.createMoveOut
);

router.get(
    "/",
    controller.getMoveOuts
);

router.get(
    "/:id",
    validation.validateMoveOutId,
    controller.getMoveOut
);

router.put(
    "/:id",
    validation.validateMoveOutId,
    controller.updateMoveOut
);

router.post(
    "/:id/start-checklist",
    validation.validateMoveOutId,
    controller.startChecklist
);

router.post(
    "/:id/complete-checklist",
    validation.validateMoveOutId,
    controller.completeChecklist
);

router.post(
    "/:id/outstanding-dues",
    validation.validateMoveOutId,
    validation.validateOutstandingDues,
    controller.updateOutstandingDues
);

router.post(
    "/:id/financial-clearance",
    validation.validateMoveOutId,
    controller.submitFinancialClearance
);

router.post(
    "/:id/approve",
    validation.validateMoveOutId,
    validation.validateApproval,
    controller.approveMoveOut
);

router.post(
    "/:id/reject",
    validation.validateMoveOutId,
    validation.validateRejection,
    controller.rejectMoveOut
);

router.post(
    "/:id/issue-move-out-pass",
    validation.validateMoveOutId,
    controller.issueMoveOutPass
);

router.post(
    "/:id/revoke-access",
    validation.validateMoveOutId,
    controller.revokeAccess
);

router.post(
    "/:id/complete",
    validation.validateMoveOutId,
    controller.completeMoveOut
);

router.post(
    "/:id/cancel",
    validation.validateMoveOutId,
    controller.cancelMoveOut
);

router.delete(
    "/:id",
    validation.validateMoveOutId,
    controller.deleteMoveOut
);

module.exports = router;
