
const express = require("express");

const router = express.Router();

const maintenanceController =
    require("./assetMaintenance.controller");


// Create maintenance record
router.post(
    "/",
    maintenanceController.createMaintenance
);


// Get all maintenance records
router.get(
    "/",
    maintenanceController.getAllMaintenance
);


// Get maintenance history of an asset
router.get(
    "/asset/:assetId",
    maintenanceController.getMaintenanceByAssetId
);


// Start maintenance
router.post(
    "/:id/start",
    maintenanceController.startMaintenance
);


// Complete maintenance
router.post(
    "/:id/complete",
    maintenanceController.completeMaintenance
);


// Cancel maintenance
router.post(
    "/:id/cancel",
    maintenanceController.cancelMaintenance
);


// Get maintenance by ID
router.get(
    "/:id",
    maintenanceController.getMaintenanceById
);


// Update maintenance
router.put(
    "/:id",
    maintenanceController.updateMaintenance
);


// Delete maintenance
router.delete(
    "/:id",
    maintenanceController.deleteMaintenance
);


module.exports = router;

