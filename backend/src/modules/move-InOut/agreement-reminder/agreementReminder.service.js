const repository =
    require("./agreementReminder.repository");

const Agreement =
    require("../agreement/agreement.model");
const notificationService =
    require("../agreement-notification/agreementNotification.service");


// ==================================================
// REMINDER CONFIGURATION
// ==================================================

const createConfig = async (data) => {

    if (data.daysBeforeExpiry < 0) {
        throw new Error(
            "daysBeforeExpiry cannot be negative"
        );
    }


    const existing =
        await repository.findConfig(
            data.societyId,
            data.reminderType
        );


    if (existing) {
        throw new Error(
            "Reminder configuration already exists for this type"
        );
    }


    return await repository.createConfig({
        societyId:
            data.societyId,

        daysBeforeExpiry:
            data.daysBeforeExpiry,

        reminderType:
            data.reminderType,

        enabled:
            data.enabled !== false,

        remarks:
            data.remarks || null
    });
};


const getConfigsBySociety = async (
    societyId
) => {

    return await repository.findAllConfigsBySociety(
        societyId
    );
};


const getConfig = async (id) => {

    const config =
        await repository.findConfigById(id);

    if (!config) {
        throw new Error(
            "Reminder configuration not found"
        );
    }

    return config;
};


const updateConfig = async (
    id,
    data
) => {

    const config =
        await repository.findConfigById(id);

    if (!config) {
        throw new Error(
            "Reminder configuration not found"
        );
    }


    if (
        data.daysBeforeExpiry !== undefined &&
        data.daysBeforeExpiry < 0
    ) {
        throw new Error(
            "daysBeforeExpiry cannot be negative"
        );
    }


    return await repository.updateConfig(
        id,
        data
    );
};


const deleteConfig = async (id) => {

    const config =
        await repository.deleteConfig(id);

    if (!config) {
        throw new Error(
            "Reminder configuration not found"
        );
    }

    return config;
};


// ==================================================
// REMINDER GENERATION
// ==================================================

const generateReminderForAgreement = async (
    agreement,
    config
) => {

    const existingReminder =
        await repository.findReminder(
            agreement.id,
            config.reminderType
        );


    if (existingReminder) {
        return existingReminder;
    }


    const expiryDate =
        new Date(
            `${agreement.expiryDate}T00:00:00`
        );


    const reminderDate =
        new Date(expiryDate);


    reminderDate.setDate(
        reminderDate.getDate() -
        config.daysBeforeExpiry
    );


    const reminder =
        await repository.createReminder({

            societyId:
                agreement.societyId,

            agreementId:
                agreement.id,

            reminderType:
                config.reminderType,

            daysBeforeExpiry:
                config.daysBeforeExpiry,

            agreementExpiryDate:
                agreement.expiryDate,

            reminderDate:
                reminderDate
                    .toISOString()
                    .split("T")[0],

            status:
                "PENDING"
        });


    return reminder;
};


// ==================================================
// GENERATE REMINDERS FOR ONE AGREEMENT
// ==================================================

const generateRemindersForAgreement = async (
    agreementId
) => {

    const agreement =
        await Agreement.findByPk(
            agreementId
        );


    if (!agreement) {
        throw new Error(
            "Agreement not found"
        );
    }


    const configs =
        await repository.findAllConfigsBySociety(
            agreement.societyId
        );


    const activeConfigs =
        configs.filter(
            (config) =>
                config.enabled
        );


    const reminders = [];


    for (const config of activeConfigs) {

        const reminder =
            await generateReminderForAgreement(
                agreement,
                config
            );

        reminders.push(reminder);
    }


    return reminders;
};


// ==================================================
// GENERATE REMINDERS FOR ALL ACTIVE AGREEMENTS
// ==================================================

const generateAllReminders = async () => {

    const agreements =
        await Agreement.findAll({
            where: {
                status: [
                    "ACTIVE",
                    "EXPIRING_SOON",
                    "RENEWAL_INITIATED"
                ]
            }
        });


    const results = [];


    for (const agreement of agreements) {

        const reminders =
            await generateRemindersForAgreement(
                agreement.id
            );

        results.push({
            agreementId:
                agreement.id,

            reminders
        });
    }


    return results;
};


// ==================================================
// GET REMINDERS
// ==================================================

const getReminders = async () => {

    return await repository.findAllReminders();
};


const getReminder = async (id) => {

    const reminder =
        await repository.findReminderById(id);

    if (!reminder) {
        throw new Error(
            "Agreement reminder not found"
        );
    }

    return reminder;
};


const getRemindersByAgreement = async (
    agreementId
) => {

    return await repository.findByAgreement(
        agreementId
    );
};


const getPendingReminders = async () => {

    return await repository.findPendingReminders();
};


// ==================================================
// PROCESS REMINDER
// ==================================================

const processReminder = async (
    id
) => {

    const reminder =
        await repository.findReminderById(id);


    if (!reminder) {
        throw new Error(
            "Agreement reminder not found"
        );
    }


    if (reminder.status !== "PENDING") {

        throw new Error(
            "Only pending reminders can be processed"
        );
    }


    const agreement =
        await Agreement.findByPk(
            reminder.agreementId
        );


    if (!agreement) {

        return await repository.updateReminder(
            id,
            {
                status: "SKIPPED",

                processedAt:
                    new Date(),

                remarks:
                    "Agreement no longer exists"
            }
        );
    }


    /*
     * If renewal has already been completed,
     * there is no reason to send an expiry reminder.
     */

    if (
        agreement.status === "RENEWED" ||
        agreement.renewalStatus === "RENEWED"
    ) {

        return await repository.updateReminder(
            id,
            {
                status: "SKIPPED",

                processedAt:
                    new Date(),

                remarks:
                    "Reminder skipped because agreement was renewed"
            }
        );
    }


    // Manual processing must produce the same in-app notification as the
    // scheduled workflow. Reuse an existing notification if this reminder
    // was already queued, so retrying the action cannot create duplicates.
    const existingNotifications = await notificationService.getByReminder(id);
    let notification = existingNotifications[0] || null;
    if (!notification) {
        notification = await notificationService.createFromReminder(reminder);
    }
    if (!notification) {
        return await repository.updateReminder(id, {
            status: "SKIPPED",
            processedAt: new Date(),
            remarks: "Notification could not be created"
        });
    }

    return await repository.updateReminder(id, {
        status: "PROCESSED",
        processedAt: new Date(),
        remarks: "Notification queued successfully"
    });
};


// ==================================================
// DELETE REMINDER
// ==================================================

const deleteReminder = async (id) => {

    const reminder =
        await repository.deleteReminder(id);

    if (!reminder) {
        throw new Error(
            "Agreement reminder not found"
        );
    }

    return reminder;
};


module.exports = {

    createConfig,

    getConfigsBySociety,

    getConfig,

    updateConfig,

    deleteConfig,

    generateRemindersForAgreement,

    generateAllReminders,

    getReminders,

    getReminder,

    getRemindersByAgreement,

    getPendingReminders,

    processReminder,

    deleteReminder
};
