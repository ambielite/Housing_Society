const express = require("express");

const router = express.Router();

const controller =
    require("./agreementNotification.controller");


/*
 * Create notification
 */
router.post(
    "/",
    controller.create
);


/*
 * Get all notifications
 */
router.get(
    "/",
    controller.getAll
);


/*
 * Get pending notifications
 */
router.get(
    "/pending",
    controller.getPending
);


/*
 * Get notifications by agreement
 */
router.get(
    "/agreement/:agreementId",
    controller.getByAgreement
);


/*
 * Get notifications by reminder
 */
router.get(
    "/reminder/:reminderId",
    controller.getByReminder
);


/*
 * Manually execute scheduler
 *
 * Useful for testing.
 */
router.post(
    "/scheduler/run",
    controller.runScheduler
);


/*
 * Process notification
 */
router.post(
    "/:id/process",
    controller.process
);


/*
 * Mark notification as read
 */
router.post(
    "/:id/read",
    controller.markRead
);


/*
 * Get notification by ID
 */
router.get(
    "/:id",
    controller.getById
);


/*
 * Delete notification
 */
router.delete(
    "/:id",
    controller.deleteNotification
);


module.exports = router;