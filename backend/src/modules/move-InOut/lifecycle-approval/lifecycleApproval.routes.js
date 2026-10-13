const express = require("express");

const router = express.Router();

const controller =
    require("./lifecycleApproval.controller");

const validation =
    require("./lifecycleApproval.validation");


router.post(
    "/",
    validation.validateCreateApproval,
    controller.createApproval
);


router.get(
    "/",
    controller.getApprovals
);


router.get(
    "/pending",
    controller.getPendingApprovals
);


router.get(
    "/lifecycle/:lifecycleType/:lifecycleId",
    validation.validateLifecycle,
    controller.getApprovalsByLifecycle
);


router.get(
    "/:id",
    validation.validateApprovalId,
    controller.getApproval
);


router.post(
    "/:id/approve",
    validation.validateApprovalId,
    validation.validateAction,
    controller.approveApproval
);


router.post(
    "/:id/reject",
    validation.validateApprovalId,
    validation.validateRejection,
    controller.rejectApproval
);


router.delete(
    "/:id",
    validation.validateApprovalId,
    controller.deleteApproval
);


module.exports = router;