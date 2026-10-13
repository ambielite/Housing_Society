const express = require("express");

const router = express.Router();

const controller =
    require("./event.controller");


router.post(
    "/",
    controller.createEvent
);

router.get(
    "/",
    controller.getEvents
);

router.get(
    "/:id",
    controller.getEventById
);

router.put(
    "/:id",
    controller.updateEvent
);

router.post(
    "/:id/submit",
    controller.submitEventForApproval
);

router.post(
    "/:id/approve",
    controller.approveEvent
);

router.post(
    "/:id/publish",
    controller.publishEvent
);

router.post(
    "/:id/cancel",
    controller.cancelEvent
);

router.post(
    "/:id/complete",
    controller.completeEvent
);

router.delete(
    "/:id",
    controller.deleteEvent
);


module.exports = router;