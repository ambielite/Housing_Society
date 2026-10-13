
const notificationRepository =
    require("./notification.repository");

const NotificationTemplate =
    require("../notification-template/notificationTemplate.model");

const Society =
    require("../../../modules/societies/society/society.model");

const notificationProvider =
    require("../providers/notification.provider");

const {
    validateCreateNotification,
    validateUpdateNotification,
    validateId
} = require("../notification-template/notification.validation");


// ============================================================
// CREATE NOTIFICATION
// ============================================================

const createNotification = async (data) => {

    const errors =
        validateCreateNotification(data);

    if (errors.length > 0) {
        throw new Error(errors.join(", "));
    }


    // Check society
    const society =
        await Society.findByPk(data.societyId);

    if (!society) {
        throw new Error(
            "Society not found"
        );
    }


    // Check template if provided
    if (data.templateId) {

        const template =
            await NotificationTemplate.findByPk(
                data.templateId
            );

        if (!template) {
            throw new Error(
                "Notification template not found"
            );
        }

        if (
            template.societyId !== null &&
            template.societyId !== data.societyId
        ) {
            throw new Error(
                "Notification template does not belong to this society"
            );
        }

        if (
            template.channel !== data.channel
        ) {
            throw new Error(
                "Notification channel does not match template channel"
            );
        }
    }


    return await notificationRepository.create(
        data
    );
};


// ============================================================
// GET ALL NOTIFICATIONS
// ============================================================

const getAllNotifications = async (
    filters = {}
) => {

    const where = {};


    if (filters.societyId) {
        where.societyId =
            filters.societyId;
    }

    if (filters.userId) {
        where.userId =
            filters.userId;
    }

    if (filters.channel) {
        where.channel =
            filters.channel;
    }

    if (filters.notificationType) {
        where.notificationType =
            filters.notificationType;
    }

    if (filters.status) {
        where.status =
            filters.status;
    }

    if (filters.priority) {
        where.priority =
            filters.priority;
    }

    if (filters.isRead !== undefined) {
        where.isRead =
            filters.isRead;
    }


    return await notificationRepository.findAll(
        where
    );
};


// ============================================================
// GET NOTIFICATION BY ID
// ============================================================

const getNotificationById = async (id) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid notification ID"
        );
    }


    const notification =
        await notificationRepository.findById(
            id
        );

    if (!notification) {
        throw new Error(
            "Notification not found"
        );
    }


    return notification;
};


// ============================================================
// GET USER NOTIFICATIONS
// ============================================================

const getUserNotifications = async (
    societyId,
    userId,
    filters = {}
) => {

    if (!validateId(societyId)) {
        throw new Error(
            "Invalid society ID"
        );
    }

    if (!validateId(userId)) {
        throw new Error(
            "Invalid user ID"
        );
    }


    const where = {};


    if (filters.channel) {
        where.channel =
            filters.channel;
    }

    if (filters.status) {
        where.status =
            filters.status;
    }

    if (filters.isRead !== undefined) {
        where.isRead =
            filters.isRead;
    }


    return await notificationRepository.findByUser(
        societyId,
        userId,
        where
    );
};


// ============================================================
// GET UNREAD NOTIFICATIONS
// ============================================================

const getUnreadNotifications = async (
    societyId,
    userId
) => {

    if (!validateId(societyId)) {
        throw new Error(
            "Invalid society ID"
        );
    }

    if (!validateId(userId)) {
        throw new Error(
            "Invalid user ID"
        );
    }


    return await notificationRepository.findUnreadByUser(
        societyId,
        userId
    );
};


// ============================================================
// UPDATE NOTIFICATION
// ============================================================

const updateNotification = async (
    id,
    data
) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid notification ID"
        );
    }


    const errors =
        validateUpdateNotification(data);

    if (errors.length > 0) {
        throw new Error(errors.join(", "));
    }


    const notification =
        await notificationRepository.findById(
            id
        );

    if (!notification) {
        throw new Error(
            "Notification not found"
        );
    }


    if (
        notification.status === "DELIVERED"
    ) {
        throw new Error(
            "Delivered notification cannot be updated"
        );
    }


    return await notificationRepository.update(
        notification,
        data
    );
};


// ============================================================
// MARK AS READ
// ============================================================

const markAsRead = async (id) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid notification ID"
        );
    }


    const notification =
        await notificationRepository.findById(
            id
        );

    if (!notification) {
        throw new Error(
            "Notification not found"
        );
    }


    if (!notification.isRead) {

        return await notificationRepository.update(
            notification,
            {
                isRead: true,
                readAt: new Date()
            }
        );
    }


    return notification;
};


// ============================================================
// MARK AS UNREAD
// ============================================================

const markAsUnread = async (id) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid notification ID"
        );
    }


    const notification =
        await notificationRepository.findById(
            id
        );

    if (!notification) {
        throw new Error(
            "Notification not found"
        );
    }


    return await notificationRepository.update(
        notification,
        {
            isRead: false,
            readAt: null
        }
    );
};


// ============================================================
// SEND NOTIFICATION
// ============================================================

const sendNotification = async (id) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid notification ID"
        );
    }


    const notification =
        await notificationRepository.findById(
            id
        );

    if (!notification) {
        throw new Error(
            "Notification not found"
        );
    }


    if (
        notification.status === "CANCELLED"
    ) {
        throw new Error(
            "Cancelled notification cannot be sent"
        );
    }


    if (["SENT", "DELIVERED"].includes(notification.status)) {
        return notification;
    }

    if (notification.status === "PROCESSING") {
        throw new Error("Notification is already being sent");
    }

    await notificationRepository.update(notification, {
        status: "PROCESSING",
        errorMessage: null
    });

    try {
        const result = await notificationProvider.sendNotification(notification);

        if (result?.success === false) {
            throw new Error(result.error || "Notification provider rejected the message");
        }

        return await notificationRepository.update(notification, {
            status: "SENT",
            sentAt: new Date(),
            errorMessage: null
        });
    } catch (error) {
        await notificationRepository.update(notification, {
            status: "FAILED",
            failedAt: new Date(),
            errorMessage: error.message || "Notification delivery failed",
            retryCount: (notification.retryCount || 0) + 1
        });
        throw error;
    }
};


// ============================================================
// MARK DELIVERED
// ============================================================

const markDelivered = async (id) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid notification ID"
        );
    }


    const notification =
        await notificationRepository.findById(
            id
        );

    if (!notification) {
        throw new Error(
            "Notification not found"
        );
    }


    return await notificationRepository.update(
        notification,
        {
            status: "DELIVERED",
            deliveredAt: new Date()
        }
    );
};


// ============================================================
// MARK FAILED
// ============================================================

const markFailed = async (
    id,
    errorMessage
) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid notification ID"
        );
    }


    const notification =
        await notificationRepository.findById(
            id
        );

    if (!notification) {
        throw new Error(
            "Notification not found"
        );
    }


    return await notificationRepository.update(
        notification,
        {
            status: "FAILED",
            failedAt: new Date(),
            errorMessage:
                errorMessage || "Notification delivery failed",
            retryCount:
                notification.retryCount + 1
        }
    );
};


// ============================================================
// CANCEL NOTIFICATION
// ============================================================

const cancelNotification = async (id) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid notification ID"
        );
    }


    const notification =
        await notificationRepository.findById(
            id
        );

    if (!notification) {
        throw new Error(
            "Notification not found"
        );
    }


    if (
        notification.status === "DELIVERED"
    ) {
        throw new Error(
            "Delivered notification cannot be cancelled"
        );
    }


    return await notificationRepository.update(
        notification,
        {
            status: "CANCELLED"
        }
    );
};


// ============================================================
// DELETE NOTIFICATION
// ============================================================

const deleteNotification = async (id) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid notification ID"
        );
    }


    const notification =
        await notificationRepository.findById(
            id
        );

    if (!notification) {
        throw new Error(
            "Notification not found"
        );
    }


    if (
        notification.status === "SENT" ||
        notification.status === "DELIVERED"
    ) {
        throw new Error(
            "Sent or delivered notification cannot be deleted"
        );
    }


    return await notificationRepository.remove(
        notification
    );
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

