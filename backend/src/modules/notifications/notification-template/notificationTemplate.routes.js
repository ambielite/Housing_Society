
const express = require("express");

const router =
    express.Router();

const controller =
    require("./notificationTemplate.controller");

// CREATE
router.post(
    "/",
    controller.createTemplate
);

// GET ALL
router.get(
    "/",
    controller.getAllTemplates
);

// GET BY ID
router.get(
    "/:id",
    controller.getTemplateById
);

// UPDATE
router.put(
    "/:id",
    controller.updateTemplate
);

// ACTIVATE
router.post(
    "/:id/activate",
    controller.activateTemplate
);

// DEACTIVATE
router.post(
    "/:id/deactivate",
    controller.deactivateTemplate
);

// DELETE
router.delete(
    "/:id",
    controller.deleteTemplate
);

module.exports = router;
