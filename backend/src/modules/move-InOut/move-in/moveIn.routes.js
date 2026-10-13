const express = require("express");

const router = express.Router();

const controller = require("./moveIn.controller");

const validation = require("./moveIn.validation");

router.post(
    "/",
    validation.validateCreateMoveIn,
    controller.createMoveIn
);

router.get(
    "/",
    controller.getMoveIns
);

router.get(
    "/:id",
    validation.validateMoveInId,
    controller.getMoveIn
);

router.put(
    "/:id",
    validation.validateMoveInId,
    validation.validateUpdateMoveIn,
    controller.updateMoveIn
);

router.post(
    "/:id/submit-documents",
    validation.validateMoveInId,
    controller.submitDocuments
);

router.post(
    "/:id/request-information",
    validation.validateMoveInId,
    controller.requestInformation
);

router.post(
    "/:id/verify",
    validation.validateMoveInId,
    controller.startVerification
);

router.post(
    "/:id/approve",
    validation.validateMoveInId,
    validation.validateApproval,
    controller.approveMoveIn
);

router.post(
    "/:id/reject",
    validation.validateMoveInId,
    validation.validateRejection,
    controller.rejectMoveIn
);

router.post(
    "/:id/issue-gate-pass",
    validation.validateMoveInId,
    controller.issueGatePass
);

router.post(
    "/:id/ledger-created",
    validation.validateMoveInId,
    controller.markLedgerCreated
);

router.post(
    "/:id/activate-access",
    validation.validateMoveInId,
    controller.activateAccess
);

router.post(
    "/:id/complete",
    validation.validateMoveInId,
    controller.completeMoveIn
);

router.delete(
    "/:id",
    validation.validateMoveInId,
    controller.deleteMoveIn
);

module.exports = router;
