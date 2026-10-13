const express = require("express");

const settingsController =
    require("./society-settings.controller");

const {
    validateSocietyId,
    validateSettingsId,
    validateCreateSettings,
    validateUpdateSettings
} = require("./society-settings.validation");


const router = express.Router();


// Create Society Settings
// POST /api/v1/admin/society-settings
router.post(
    "/",
    validateCreateSettings,
    settingsController.createSettings
);


// Get Settings by Society
// GET /api/v1/admin/society-settings/society/:societyId
router.get(
    "/society/:societyId",
    validateSocietyId,
    settingsController.getSettingsBySociety
);


// Get Settings by ID
// GET /api/v1/admin/society-settings/:id
router.get(
    "/:id",
    validateSettingsId,
    settingsController.getSettingsById
);


// Update Settings
// PUT /api/v1/admin/society-settings/:id
router.put(
    "/:id",
    validateSettingsId,
    validateUpdateSettings,
    settingsController.updateSettings
);


module.exports = router;