const express = require("express");

const router = express.Router();

const controller =
    require("./meetingAgenda.controller");

router.post(
    "/",
    controller.createAgenda
);

router.get(
    "/meeting/:meetingId",
    controller.getAgendas
);

router.get(
    "/:id",
    controller.getAgendaById
);

router.put(
    "/:id",
    controller.updateAgenda
);

router.post(
    "/:id/status",
    controller.updateAgendaStatus
);

router.delete(
    "/:id",
    controller.deleteAgenda
);

module.exports = router;