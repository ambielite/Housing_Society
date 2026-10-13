
const express = require("express");

const router = express.Router();

const notificationController =
    require("./notification.controller");


// ============================================================
// CREATE
// ============================================================

router.post(
    "/",
    notificationController.createNotification
);


// ============================================================
// GET ALL
// ============================================================

router.get(
    "/",
    notificationController.getAllNotifications
);


// ============================================================
// USER NOTIFICATIONS
// IMPORTANT: Keep these routes before /:id
// ============================================================

router.get(
    "/user/:societyId/:userId",
    notificationController.getUserNotifications
);


router.get(
    "/user/:societyId/:userId/unread",
    notificationController.getUnreadNotifications
);


// ============================================================
// GET BY ID
// ============================================================

router.get(
    "/:id",
    notificationController.getNotificationById
);


// ============================================================
// UPDATE
// ============================================================

router.put(
    "/:id",
    notificationController.updateNotification
);


// ============================================================
// MARK READ / UNREAD
// ============================================================

router.post(
    "/:id/read",
    notificationController.markAsRead
);


router.post(
    "/:id/unread",
    notificationController.markAsUnread
);


// ============================================================
// SEND
// ============================================================

router.post(
    "/:id/send",
    notificationController.sendNotification
);


// ============================================================
// DELIVERED
// ============================================================

router.post(
    "/:id/delivered",
    notificationController.markDelivered
);


// ============================================================
// FAILED
// ============================================================

router.post(
    "/:id/failed",
    notificationController.markFailed
);


// ============================================================
// CANCEL
// ============================================================

router.post(
    "/:id/cancel",
    notificationController.cancelNotification
);


// ============================================================
// DELETE
// ============================================================

router.delete(
    "/:id",
    notificationController.deleteNotification
);


module.exports = router;

