const repository = require("./agreementNotification.repository");

const Agreement = require("../agreement/agreement.model");
const AgreementReminder = require("../agreement-reminder/agreementReminder.model");

const createNotification = async (data) => {

    if (!data.agreementId) {
        throw new Error("agreementId is required");
    }

    if (!data.societyId) {
        throw new Error("societyId is required");
    }

    if (!data.recipient) {
        throw new Error("recipient is required");
    }

    if (!data.channel) {
        throw new Error("channel is required");
    }

    if (!data.message) {
        throw new Error("message is required");
    }

    const agreement = await Agreement.findByPk(data.agreementId);

    if (!agreement) {
        throw new Error("Agreement not found");
    }

    return await repository.create(data);
};


const createFromReminder = async (reminder) => {

    const agreement = await Agreement.findByPk(
        reminder.agreementId
    );

    if (!agreement) {
        await AgreementReminder.update(
            {
                status: "SKIPPED",
                remarks: "Agreement not found"
            },
            {
                where: {
                    id: reminder.id
                }
            }
        );

        return null;
    }

    /*
     * In the first version, recipient information
     * is taken from agreement metadata.
     *
     * Later this can come from Resident/Tenant/User module.
     */

    const recipient =
        agreement.tenantEmail ||
        agreement.ownerEmail ||
        "admin@housing.local";

    const recipientName =
        agreement.tenantName ||
        agreement.ownerName ||
        "Resident";

    const channel = "IN_APP";

    const subject =
        `Agreement Expiry Reminder - ${reminder.reminderType}`;

    const message =
        `Your agreement ${agreement.agreementReference ||
        ""} is approaching its expiry date ${reminder.agreementExpiryDate}.`;

    const notification = await repository.create({

        societyId: reminder.societyId,

        agreementId: reminder.agreementId,

        reminderId: reminder.id,

        notificationType: reminder.reminderType,

        recipient,

        recipientName,

        channel,

        subject,

        message,

        scheduledAt: new Date(),

        deliveryStatus: "PENDING",

        metadata: {
            agreementExpiryDate:
                reminder.agreementExpiryDate,

            daysBeforeExpiry:
                reminder.daysBeforeExpiry
        }
    });

    return notification;
};


const processNotification = async (id) => {

    const notification =
        await repository.findById(id);

    if (!notification) {
        throw new Error("Notification not found");
    }

    if (
        notification.deliveryStatus !== "PENDING"
    ) {
        throw new Error(
            "Only PENDING notifications can be processed"
        );
    }

    await repository.update(id, {
        deliveryStatus: "PROCESSING"
    });

    try {

        /*
         * Actual provider integration will be added later.
         *
         * For now we simulate successful delivery.
         */

        const providerMessageId =
            `LOCAL-${Date.now()}`;

        const updated =
            await repository.update(id, {

                deliveryStatus: "SENT",

                sentAt: new Date(),

                deliveredAt: new Date(),

                providerMessageId
            });

        return updated;

    } catch (error) {

        await repository.update(id, {

            deliveryStatus: "FAILED",

            failureReason: error.message
        });

        throw error;
    }
};


const markAsRead = async (id) => {

    const notification =
        await repository.findById(id);

    if (!notification) {
        throw new Error("Notification not found");
    }

    if (
        notification.deliveryStatus !== "DELIVERED" &&
        notification.deliveryStatus !== "SENT"
    ) {
        throw new Error(
            "Notification cannot be marked as read"
        );
    }

    return await repository.update(id, {

        deliveryStatus: "READ",

        readAt: new Date()
    });
};


const processPendingNotifications = async () => {

    const notifications =
        await repository.findPending();

    const results = [];

    for (const notification of notifications) {

        try {

            const processed =
                await processNotification(
                    notification.id
                );

            results.push({
                id: notification.id,
                status: "SENT",
                notification: processed
            });

        } catch (error) {

            results.push({
                id: notification.id,
                status: "FAILED",
                error: error.message
            });
        }
    }

    return results;
};


const getAllNotifications = async () => {
    return await repository.findAll();
};


const getNotificationById = async (id) => {

    const notification =
        await repository.findById(id);

    if (!notification) {
        throw new Error("Notification not found");
    }

    return notification;
};


const getByAgreement = async (agreementId) => {
    return await repository.findByAgreement(
        agreementId
    );
};


const getByReminder = async (reminderId) => {
    return await repository.findByReminder(
        reminderId
    );
};


const getPending = async () => {
    return await repository.findPending();
};


const deleteNotification = async (id) => {

    const deleted =
        await repository.deleteById(id);

    if (!deleted) {
        throw new Error("Notification not found");
    }

    return deleted;
};


module.exports = {

    createNotification,

    createFromReminder,

    processNotification,

    processPendingNotifications,

    markAsRead,

    getAllNotifications,

    getNotificationById,

    getByAgreement,

    getByReminder,

    getPending,

    deleteNotification
};