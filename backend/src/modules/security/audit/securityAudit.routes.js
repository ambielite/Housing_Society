const express = require("express");

const router = express.Router();

const controller =
    require("./securityAudit.controller");


router.post(
    "/",
    controller.createAudit
);


router.get(
    "/",
    controller.getAllAudits
);


router.get(
    "/:id",
    controller.getAuditById
);


router.delete(
    "/:id",
    controller.deleteAudit
);


module.exports = router;