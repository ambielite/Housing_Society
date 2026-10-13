const express = require("express");

const router = express.Router();

const controller =
    require("./ledgerAccount.controller");

const validation =
    require("./ledgerAccount.validation");


router.post(
    "/",
    validation.validateCreateLedgerAccount,
    controller.create
);

router.get(
    "/",
    controller.getAll
);

router.get(
    "/society/:societyId/unit/:unitId",
    controller.getByUnit
);

router.get(
    "/society/:societyId/member/:memberId",
    controller.getByMember
);

router.get(
    "/:id",
    controller.getById
);

router.put(
    "/:id",
    controller.update
);

router.post(
    "/:id/activate",
    controller.activate
);

router.post(
    "/:id/deactivate",
    controller.deactivate
);

router.delete(
    "/:id",
    controller.remove
);


module.exports = router;