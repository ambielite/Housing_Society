const express = require("express");

const router =
    express.Router();

const controller =
    require("./accountingPeriod.controller");


router.post(
    "/",
    controller.create
);


router.get(
    "/",
    controller.getAll
);


router.get(
    "/society/:societyId",
    controller.getBySociety
);


router.get(
    "/society/:societyId/open",
    controller.getOpen
);


router.get(
    "/society/:societyId/status/:status",
    controller.getByStatus
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
    "/:id/close",
    controller.close
);


router.post(
    "/:id/lock",
    controller.lock
);


router.delete(
    "/:id",
    controller.remove
);


module.exports = router;