const express = require("express");

const router = express.Router();

const controller =
    require("./trialBalance.controller");


router.get(
    "/society/:societyId",
    controller.getTrialBalance
);


module.exports = router;