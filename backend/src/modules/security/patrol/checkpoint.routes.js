const express = require("express");

const router = express.Router();

const controller =
    require("./checkpoint.controller");


router.post(
    "/",
    controller.createCheckpoint
);


router.get(
    "/",
    controller.getAllCheckpoints
);


router.get(
    "/:id",
    controller.getCheckpointById
);


router.put(
    "/:id",
    controller.updateCheckpoint
);


router.post(
    "/:id/activate",
    controller.activateCheckpoint
);


router.post(
    "/:id/deactivate",
    controller.deactivateCheckpoint
);


router.delete(
    "/:id",
    controller.deleteCheckpoint
);


module.exports = router;