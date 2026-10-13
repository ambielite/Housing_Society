const express = require("express");

const router = express.Router();

const controller =
    require("./agreementReminder.controller");

const validation =
    require("./agreementReminder.validation");


// ==========================================
// CONFIGURATION
// ==========================================

router.post(
    "/config",
    validation.validateCreateConfig,
    controller.createConfig
);


router.get(
    "/config/society/:societyId",
    validation.validateSocietyId,
    controller.getConfigsBySociety
);


router.get(
    "/config/:id",
    validation.validateId,
    controller.getConfig
);


router.put(
    "/config/:id",
    validation.validateId,
    controller.updateConfig
);


router.delete(
    "/config/:id",
    validation.validateId,
    controller.deleteConfig
);


// ==========================================
// REMINDER GENERATION
// ==========================================

router.post(
    "/generate",
    controller.generateAllReminders
);


router.post(
    "/agreement/:agreementId/generate",
    validation.validateAgreementId,
    controller.generateRemindersForAgreement
);


// ==========================================
// REMINDER QUERY
// ==========================================

router.get(
    "/",
    controller.getReminders
);


router.get(
    "/pending",
    controller.getPendingReminders
);


router.get(
    "/agreement/:agreementId",
    validation.validateAgreementId,
    controller.getRemindersByAgreement
);


router.get(
    "/:id",
    validation.validateId,
    controller.getReminder
);


// ==========================================
// PROCESS REMINDER
// ==========================================

router.post(
    "/:id/process",
    validation.validateId,
    controller.processReminder
);


router.delete(
    "/:id",
    validation.validateId,
    controller.deleteReminder
);


module.exports = router;