const express = require("express");

const router = express.Router();

const controller =
    require("./classified.controller");


router.post(
    "/",
    controller.createClassified
);


router.get(
    "/",
    controller.getClassifieds
);


router.get(
    "/:id",
    controller.getClassifiedById
);


router.put(
    "/:id",
    controller.updateClassified
);


router.post(
    "/:id/submit",
    controller.submitForApproval
);


router.post(
    "/:id/approve",
    controller.approveClassified
);


router.post(
    "/:id/reject",
    controller.rejectClassified
);


router.post(
    "/:id/publish",
    controller.publishClassified
);


router.post(
    "/:id/sold",
    controller.markAsSold
);


router.post(
    "/:id/remove",
    controller.removeClassified
);


router.post(
    "/:id/expire",
    controller.expireClassified
);


router.delete(
    "/:id",
    controller.deleteClassified
);


module.exports = router;