const express = require("express");

const router = express.Router();

const controller =
    require("./incident.controller");


router.post(
    "/",
    controller.createIncident
);


router.get(
    "/",
    controller.getAllIncidents
);


router.get(
    "/:id",
    controller.getIncidentById
);


router.put(
    "/:id",
    controller.updateIncident
);


router.post(
    "/:id/acknowledge",
    controller.acknowledgeIncident
);


router.post(
    "/:id/investigate",
    controller.startInvestigation
);


router.post(
    "/:id/resolve",
    controller.resolveIncident
);


router.post(
    "/:id/close",
    controller.closeIncident
);


router.post(
    "/:id/reject",
    controller.rejectIncident
);


router.post(
    "/:id/assign",
    controller.assignIncident
);


router.delete(
    "/:id",
    controller.deleteIncident
);


module.exports = router;