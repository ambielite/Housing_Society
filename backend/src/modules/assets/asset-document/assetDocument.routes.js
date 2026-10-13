
const express = require("express");
const multer = require("multer");

const router = express.Router();

const assetDocumentController =
    require("./assetDocument.controller");


// ======================================================
// MULTER CONFIGURATION
// ======================================================

const upload = multer({

    storage: multer.memoryStorage(),

    limits: {

        fileSize:
            10 * 1024 * 1024
    }
});


// ======================================================
// CREATE DOCUMENT
// ======================================================

router.post(
    "/",
    upload.single("file"),
    assetDocumentController.createAssetDocument
);


// ======================================================
// GET ALL
// ======================================================

router.get(
    "/",
    assetDocumentController.getAllAssetDocuments
);


// ======================================================
// UPDATE EXPIRED
// ======================================================

router.post(
    "/update-expired",
    assetDocumentController.updateExpiredDocuments
);


// ======================================================
// GET BY ASSET
// ======================================================

router.get(
    "/asset/:assetId",
    assetDocumentController.getAssetDocumentsByAssetId
);


// ======================================================
// GET WARRANTY DOCUMENTS
// ======================================================

router.get(
    "/asset/:assetId/warranty",
    assetDocumentController.getWarrantyDocuments
);


// ======================================================
// GET BY ID
// ======================================================

router.get(
    "/:id",
    assetDocumentController.getAssetDocumentById
);


// ======================================================
// UPDATE
// ======================================================

router.put(
    "/:id",
    assetDocumentController.updateAssetDocument
);


// ======================================================
// ACTIVATE
// ======================================================

router.post(
    "/:id/activate",
    assetDocumentController.activateAssetDocument
);


// ======================================================
// DEACTIVATE
// ======================================================

router.post(
    "/:id/deactivate",
    assetDocumentController.deactivateAssetDocument
);


// ======================================================
// DELETE
// ======================================================

router.delete(
    "/:id",
    assetDocumentController.deleteAssetDocument
);


module.exports = router;

