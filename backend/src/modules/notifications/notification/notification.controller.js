
const notificationService =
    require("./notification.service");


// ============================================================
// CREATE
// ============================================================

const createNotification = async (
    req,
    res
) => {

    try {

        const notification =
            await notificationService.createNotification(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Notification created successfully",
            data: notification
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// GET ALL
// ============================================================

const getAllNotifications = async (
    req,
    res
) => {

    try {

        const notifications =
            await notificationService.getAllNotifications(
                req.query
            );

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// GET BY ID
// ============================================================

const getNotificationById = async (
    req,
    res
) => {

    try {

        const notification =
            await notificationService.getNotificationById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: notification
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// GET USER NOTIFICATIONS
// ============================================================

const getUserNotifications = async (
    req,
    res
) => {

    try {

        const notifications =
            await notificationService.getUserNotifications(
                req.params.societyId,
                req.params.userId,
                req.query
            );

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// GET UNREAD
// ============================================================

const getUnreadNotifications = async (
    req,
    res
) => {

    try {

        const notifications =
            await notificationService.getUnreadNotifications(
                req.params.societyId,
                req.params.userId
            );

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// UPDATE
// ============================================================

const updateNotification = async (
    req,
    res
) => {

    try {

        const notification =
            await notificationService.updateNotification(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Notification updated successfully",
            data: notification
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// MARK READ
// ============================================================

const markAsRead = async (
    req,
    res
) => {

    try {

        const notification =
            await notificationService.markAsRead(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Notification marked as read",
            data: notification
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// MARK UNREAD
// ============================================================

const markAsUnread = async (
    req,
    res
) => {

    try {

        const notification =
            await notificationService.markAsUnread(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Notification marked as unread",
            data: notification
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// SEND
// ============================================================

const sendNotification = async (
    req,
    res
) => {

    try {

        const notification =
            await notificationService.sendNotification(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Notification sent successfully",
            data: notification
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// DELIVERED
// ============================================================

const markDelivered = async (
    req,
    res
) => {

    try {

        const notification =
            await notificationService.markDelivered(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Notification marked as delivered",
            data: notification
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// FAILED
// ============================================================

const markFailed = async (
    req,
    res
) => {

    try {

        const notification =
            await notificationService.markFailed(
                req.params.id,
                req.body.errorMessage
            );

        res.status(200).json({
            success: true,
            message:
                "Notification marked as failed",
            data: notification
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// CANCEL
// ============================================================

const cancelNotification = async (
    req,
    res
) => {

    try {

        const notification =
            await notificationService.cancelNotification(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Notification cancelled successfully",
            data: notification
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================================
// DELETE
// ============================================================

const deleteNotification = async (
    req,
    res
) => {

    try {

        await notificationService.deleteNotification(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message:
                "Notification deleted successfully"
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createNotification,
    getAllNotifications,
    getNotificationById,
    getUserNotifications,
    getUnreadNotifications,
    updateNotification,
    markAsRead,
    markAsUnread,
    sendNotification,
    markDelivered,
    markFailed,
    cancelNotification,
    deleteNotification
};
