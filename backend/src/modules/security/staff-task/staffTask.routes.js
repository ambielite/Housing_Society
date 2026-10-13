const express = require("express");

const router = express.Router();

const controller =
    require("./staffTask.controller");


// Create
router.post(
    "/",
    controller.createTask
);


// Get all
router.get(
    "/",
    controller.getAllTasks
);


// Get tasks by staff
// IMPORTANT: Keep this before /:id
router.get(
    "/staff/:staffId",
    controller.getTasksByStaff
);


// Task actions
router.post(
    "/:id/start",
    controller.startTask
);

router.post(
    "/:id/complete",
    controller.completeTask
);

router.post(
    "/:id/cancel",
    controller.cancelTask
);

router.post(
    "/:id/overdue",
    controller.markOverdue
);


// Get one
router.get(
    "/:id",
    controller.getTaskById
);


// Update
router.put(
    "/:id",
    controller.updateTask
);


// Delete
router.delete(
    "/:id",
    controller.deleteTask
);


module.exports = router;