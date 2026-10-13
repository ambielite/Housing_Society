const express = require("express");

const router = express.Router();

const amcController =
    require("./amc.controller");


router.post(
    "/",
    amcController.createAMC
);


router.get(
    "/",
    amcController.getAllAMCs
);


router.post(
    "/update-expired",
    amcController.updateExpiredAMCs
);


router.get(
    "/asset/:assetId",
    amcController.getAMCsByAssetId
);


router.get(
    "/:id",
    amcController.getAMCById
);


router.post(
    "/:id/activate",
    amcController.activateAMC
);


router.post(
    "/:id/expiring-soon",
    amcController.markExpiringSoon
);


router.post(
    "/:id/initiate-renewal",
    amcController.initiateRenewal
);


router.post(
    "/:id/renew",
    amcController.renewAMC
);


router.post(
    "/:id/expire",
    amcController.expireAMC
);


router.post(
    "/:id/terminate",
    amcController.terminateAMC
);


router.delete(
    "/:id",
    amcController.deleteAMC
);


module.exports = router;