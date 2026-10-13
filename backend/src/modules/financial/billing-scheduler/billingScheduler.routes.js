const express =
    require("express");

const router =
    express.Router();

const controller =
    require("./billingScheduler.controller");


router.post(
    "/run",
    controller.runBilling
);


module.exports = router;