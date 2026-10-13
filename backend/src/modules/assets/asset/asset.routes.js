const express = require("express");

const router = express.Router();

const controller =
    require("./asset.controller");


router.post(
    "/",
    controller.createAsset
);


router.get(
    "/",
    controller.getAllAssets
);


router.get(
    "/:id",
    controller.getAssetById
);


router.put(
    "/:id",
    controller.updateAsset
);


router.post(
    "/:id/activate",
    controller.activateAsset
);


router.post(
    "/:id/maintenance",
    controller.putUnderMaintenance
);


router.post(
    "/:id/retire",
    controller.retireAsset
);


router.post(
    "/:id/dispose",
    controller.disposeAsset
);


router.delete(
    "/:id",
    controller.deleteAsset
);


module.exports = router;