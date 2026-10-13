const express = require("express");

const router = express.Router();

const controller =
    require("./emergency.controller");


router.post(
    "/",
    controller.createEmergency
);


router.get(
    "/",
    controller.getAllEmergencies
);


router.get(
    "/:id",
    controller.getEmergencyById
);


router.put(
    "/:id",
    controller.updateEmergency
);


router.post(
    "/:id/acknowledge",
    controller.acknowledgeEmergency
);


router.post(
    "/:id/respond",
    controller.startResponse
);


router.post(
    "/:id/assign",
    controller.assignEmergency
);


router.post(
    "/:id/external-contacts",
    controller.updateEmergencyContacts
);


router.post(
    "/:id/resolve",
    controller.resolveEmergency
);


router.post(
    "/:id/close",
    controller.closeEmergency
);


router.post(
    "/:id/cancel",
    controller.cancelEmergency
);


router.post(
    "/:id/false-alarm",
    controller.markFalseAlarm
);


router.delete(
    "/:id",
    controller.deleteEmergency
);


module.exports = router;