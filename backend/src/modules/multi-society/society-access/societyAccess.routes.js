const express = require("express");

const router = express.Router();

const controller =
    require("./societyAccess.controller");


// CREATE SOCIETY ACCESS
router.post(
    "/",
    controller.createAccess
);


// GET USER SOCIETIES
router.get(
    "/user/:userId",
    controller.getUserSocieties
);


// GET DEFAULT SOCIETY
router.get(
    "/user/:userId/default",
    controller.getDefaultSociety
);


// SWITCH SOCIETY
router.post(
    "/switch",
    controller.switchSociety
);


// UPDATE ACCESS
router.put(
    "/:id",
    controller.updateAccess
);


// DELETE ACCESS
router.delete(
    "/:id",
    controller.removeAccess
);


module.exports = router;