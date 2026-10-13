
const express = require("express");

const router = express.Router();

const groupController = require("./group.controller");


// Create group
router.post(
    "/",
    groupController.createGroup
);


// Get all groups
router.get(
    "/",
    groupController.getGroups
);


// Get group by ID
router.get(
    "/:id",
    groupController.getGroupById
);


// Update group
router.put(
    "/:id",
    groupController.updateGroup
);


// Activate group
router.post(
    "/:id/activate",
    groupController.activateGroup
);


// Deactivate group
router.post(
    "/:id/deactivate",
    groupController.deactivateGroup
);


// Delete group
router.delete(
    "/:id",
    groupController.deleteGroup
);


module.exports = router;

