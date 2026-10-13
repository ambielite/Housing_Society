const express = require("express");

const router = express.Router();

const controller =
    require("./lifecycleAudit.controller");

const validation =
    require("./lifecycleAudit.validation");


router.post(
    "/",
    validation.validateCreate,
    controller.createAudit
);


router.get(
    "/",
    controller.getAudits
);


router.get(
    "/lifecycle/:lifecycleType/:lifecycleId",
    validation.validateLifecycle,
    controller.getAuditsByLifecycle
);


router.get(
    "/performer/:performedBy",
    validation.validatePerformer,
    controller.getAuditsByPerformer
);


router.get(
    "/action/:action",
    validation.validateAction,
    controller.getAuditsByAction
);


router.get(
    "/:id",
    validation.validateId,
    controller.getAudit
);


router.put(
    "/:id",
    validation.validateId,
    controller.updateAudit
);


router.delete(
    "/:id",
    validation.validateId,
    controller.deleteAudit
);


module.exports = router;