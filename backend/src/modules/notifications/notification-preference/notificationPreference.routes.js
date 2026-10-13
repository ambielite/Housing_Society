
const express = require("express");

const router =
    express.Router();

const controller =
    require("./notificationPreference.controller");

// CREATE
router.post(
    "/",
    controller.createPreference
);

// GET ALL
router.get(
    "/",
    controller.getAllPreferences
);

// GET USER PREFERENCES
router.get(
    "/user/:societyId/:userId",
    controller.getUserPreferences
);

// GET BY ID
router.get(
    "/:id",
    controller.getPreferenceById
);

// UPDATE
router.put(
    "/:id",
    controller.updatePreference
);

// ENABLE
router.post(
    "/:id/enable",
    controller.enablePreference
);

// DISABLE
router.post(
    "/:id/disable",
    controller.disablePreference
);

// DELETE
router.delete(
    "/:id",
    controller.deletePreference
);

module.exports = router;

