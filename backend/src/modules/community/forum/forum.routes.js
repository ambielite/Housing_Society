
const express = require("express");

const router = express.Router();

const forumController = require("./forum.controller");


// Create forum
router.post(
    "/",
    forumController.createForum
);


// Get forums
router.get(
    "/",
    forumController.getForums
);


// Get forum by ID
router.get(
    "/:id",
    forumController.getForumById
);


// Update forum
router.put(
    "/:id",
    forumController.updateForum
);


// Activate forum
router.post(
    "/:id/activate",
    forumController.activateForum
);


// Deactivate forum
router.post(
    "/:id/deactivate",
    forumController.deactivateForum
);


// Delete forum
router.delete(
    "/:id",
    forumController.deleteForum
);


module.exports = router;

