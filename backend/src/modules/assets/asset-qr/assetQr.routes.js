
const express = require("express");

const router = express.Router();

const assetQrController =
    require("./assetQr.controller");


// ======================================================
// CREATE QR
// ======================================================

router.post(
    "/",
    assetQrController.createAssetQr
);


// ======================================================
// GET ALL
// ======================================================

router.get(
    "/",
    assetQrController.getAllAssetQr
);


// ======================================================
// SCAN QR
// ======================================================

router.post(
    "/scan",
    assetQrController.scanAssetQr
);


// ======================================================
// GET BY ASSET ID
// ======================================================

router.get(
    "/asset/:assetId",
    assetQrController.getAssetQrByAssetId
);


// ======================================================
// GET BY QR CODE
// ======================================================

router.get(
    "/code/:qrCode",
    assetQrController.getAssetQrByCode
);


// ======================================================
// GET BY ID
// ======================================================

router.get(
    "/:id",
    assetQrController.getAssetQrById
);


// ======================================================
// UPDATE
// ======================================================

router.put(
    "/:id",
    assetQrController.updateAssetQr
);


// ======================================================
// ACTIVATE
// ======================================================

router.post(
    "/:id/activate",
    assetQrController.activateAssetQr
);


// ======================================================
// DEACTIVATE
// ======================================================

router.post(
    "/:id/deactivate",
    assetQrController.deactivateAssetQr
);


// ======================================================
// REGENERATE
// ======================================================

router.post(
    "/:id/regenerate",
    assetQrController.regenerateAssetQr
);


// ======================================================
// DELETE
// ======================================================

router.delete(
    "/:id",
    assetQrController.deleteAssetQr
);


module.exports = router;

