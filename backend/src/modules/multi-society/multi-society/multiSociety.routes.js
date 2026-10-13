const express = require("express");

const router = express.Router();

const controller =
    require("./multiSociety.controller");

const {
    validateCreateAccess
} = require("./multiSociety.validation");


router.post(
    "/access",
    validateCreateAccess,
    controller.createAccess
);


router.get(
    "/access/user/:userId",
    controller.getUserAccess
);


router.get(
    "/access/user/:userId/active",
    controller.getActiveUserAccess
);


router.get(
    "/access/user/:userId/society/:societyId",
    controller.checkSocietyAccess
);


router.post(
    "/access/:id/activate",
    controller.activateAccess
);


router.post(
    "/access/:id/deactivate",
    controller.deactivateAccess
);


router.delete(
    "/access/:id",
    controller.deleteAccess
);


module.exports = router;