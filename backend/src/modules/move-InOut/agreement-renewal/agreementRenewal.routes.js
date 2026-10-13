const express = require("express");

const router = express.Router();

const controller =
    require("./agreementRenewal.controller");

const validation =
    require("./agreementRenewal.validation");


router.post(
    "/",
    validation.validateCreate,
    controller.createRenewal
);


router.get(
    "/",
    controller.getRenewals
);


router.get(
    "/pending",
    controller.getPendingRenewals
);


router.get(
    "/agreement/:agreementId",
    validation.validateAgreementId,
    controller.getRenewalsByAgreement
);


router.get(
    "/:id",
    validation.validateId,
    controller.getRenewal
);


router.put(
    "/:id",
    validation.validateId,
    controller.updateRenewal
);


router.post(
    "/:id/submit",
    validation.validateId,
    controller.submitRenewal
);


router.post(
    "/:id/review",
    validation.validateId,
    controller.startReview
);


router.post(
    "/:id/request-information",
    validation.validateId,
    validation.validateRemarks,
    controller.requestAdditionalInformation
);


router.post(
    "/:id/approve",
    validation.validateId,
    validation.validateApproval,
    controller.approveRenewal
);


router.post(
    "/:id/reject",
    validation.validateId,
    validation.validateRemarks,
    controller.rejectRenewal
);


router.post(
    "/:id/complete",
    validation.validateId,
    controller.completeRenewal
);


router.delete(
    "/:id",
    validation.validateId,
    controller.deleteRenewal
);


module.exports = router;