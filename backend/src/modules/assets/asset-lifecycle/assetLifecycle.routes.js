
const express = require("express");

const router = express.Router();

const controller =
    require("./assetLifecycle.controller");


// ==========================================
// GENERAL LIFECYCLE
// ==========================================

router.post(
    "/",
    controller.createLifecycle
);


router.get(
    "/",
    controller.getAllLifecycles
);


// ==========================================
// SPECIALIZED REMINDERS
// ==========================================

router.post(
    "/warranty-reminder",
    controller.createWarrantyReminder
);


router.post(
    "/amc-reminder",
    controller.createAMCReminder
);


router.post(
    "/maintenance-reminder",
    controller.createMaintenanceReminder
);


router.post(
    "/low-stock-reminder",
    controller.createLowStockReminder
);


// ==========================================
// AUTOMATIC PROCESSING
// ==========================================

router.post(
    "/process-due-reminders",
    controller.processDueReminders
);


router.post(
    "/mark-expired",
    controller.markExpiredReminders
);


// ==========================================
// ASSET LIFECYCLE
// ==========================================

router.post(
    "/asset/:assetId/retire",
    controller.retireAsset
);


router.post(
    "/asset/:assetId/dispose",
    controller.disposeAsset
);


// ==========================================
// ASSET-SPECIFIC RECORDS
// ==========================================

router.get(
    "/asset/:assetId",
    controller.getLifecyclesByAssetId
);


// ==========================================
// SINGLE RECORD
// ==========================================

router.get(
    "/:id",
    controller.getLifecycleById
);


router.post(
    "/:id/send",
    controller.sendReminder
);


router.post(
    "/:id/acknowledge",
    controller.acknowledgeLifecycle
);


router.post(
    "/:id/complete",
    controller.completeLifecycle
);


router.post(
    "/:id/cancel",
    controller.cancelLifecycle
);


router.delete(
    "/:id",
    controller.deleteLifecycle
);


module.exports = router;

