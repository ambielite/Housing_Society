const express = require("express");

const router = express.Router();

const controller =
    require("./agreement.controller");

const validation =
    require("./agreement.validation");


router.post(
    "/",
    validation.validateCreate,
    controller.createAgreement
);


router.get(
    "/",
    controller.getAgreements
);


router.get(
    "/reference/:reference",
    controller.getAgreementByReference
);


router.get(
    "/unit/:unitId",
    validation.validateUUIDParam(
        "unitId",
        "Invalid unitId"
    ),
    controller.getAgreementsByUnit
);


router.get(
    "/tenant/:tenantId",
    validation.validateUUIDParam(
        "tenantId",
        "Invalid tenantId"
    ),
    controller.getAgreementsByTenant
);


router.get(
    "/owner/:ownerId",
    validation.validateUUIDParam(
        "ownerId",
        "Invalid ownerId"
    ),
    controller.getAgreementsByOwner
);


router.get(
    "/:id",
    validation.validateId,
    controller.getAgreement
);


router.put(
    "/:id",
    validation.validateId,
    controller.updateAgreement
);


router.post(
    "/:id/submit",
    validation.validateId,
    controller.submitAgreement
);


router.post(
    "/:id/verify",
    validation.validateId,
    controller.startVerification
);


router.post(
    "/:id/approve",
    validation.validateId,
    controller.approveAgreement
);


router.post(
    "/:id/reject",
    validation.validateId,
    validation.validateRemarks,
    controller.rejectAgreement
);


router.post(
    "/:id/activate",
    validation.validateId,
    controller.activateAgreement
);


router.post(
    "/:id/expiring-soon",
    validation.validateId,
    controller.markExpiringSoon
);


router.post(
    "/:id/expired",
    validation.validateId,
    controller.markExpired
);


router.post(
    "/:id/terminate",
    validation.validateId,
    validation.validateRemarks,
    controller.terminateAgreement
);


router.delete(
    "/:id",
    validation.validateId,
    controller.deleteAgreement
);


module.exports = router;