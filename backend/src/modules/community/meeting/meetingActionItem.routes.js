const express = require("express");

const router = express.Router();

const controller =
    require("./meetingActionItem.controller");

router.post(
    "/",
    controller.createActionItem
);

router.get(
    "/",
    controller.getActionItems
);

router.get(
    "/:id",
    controller.getActionItemById
);

router.put(
    "/:id",
    controller.updateActionItem
);

router.post(
    "/:id/start",
    controller.startActionItem
);

router.post(
    "/:id/complete",
    controller.completeActionItem
);

router.post(
    "/:id/cancel",
    controller.cancelActionItem
);

router.delete(
    "/:id",
    controller.deleteActionItem
);

module.exports = router;