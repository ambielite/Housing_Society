const cron = require("node-cron");

const agreementReminderService =
    require("../agreement-reminder/agreementReminder.service");

const notificationService =
    require("./agreementNotification.service");
const { Op } = require("sequelize");
const Agreement = require("../agreement/agreement.model");


/*
 * Generate agreement reminders
 *
 * Runs every day at 12:00 AM.
 */

const generateAgreementReminders = async () => {

    try {

        console.log(
            "[Scheduler] Generating agreement reminders..."
        );

        const result =
            await agreementReminderService
                .generateAllReminders();

        console.log(
            "[Scheduler] Agreement reminders generated:",
            result.length
        );

    } catch (error) {

        console.error(
            "[Scheduler] Reminder generation failed:",
            error.message
        );
    }
};


/*
 * Create notifications from pending reminders
 */

const createNotificationsFromReminders =
    async () => {

        try {

            console.log(
                "[Scheduler] Creating notifications..."
            );

            const pendingReminders =
                await agreementReminderService
                    .getPendingReminders();

            let created = 0;

            for (const reminder of pendingReminders) {

                const notification =
                    await notificationService
                        .createFromReminder(reminder);

                if (notification) {
                    created++;
                }
            }

            console.log(
                "[Scheduler] Notifications created:",
                created
            );

        } catch (error) {

            console.error(
                "[Scheduler] Notification creation failed:",
                error.message
            );
        }
    };


/*
 * Process pending notifications
 */

const processNotifications = async () => {

    try {

        console.log(
            "[Scheduler] Processing notifications..."
        );

        const result =
            await notificationService
                .processPendingNotifications();

        console.log(
            "[Scheduler] Notifications processed:",
            result.length
        );

    } catch (error) {

        console.error(
            "[Scheduler] Notification processing failed:",
            error.message
        );
    }
};


/*
 * Main scheduled workflow
 */

const runAgreementNotificationScheduler =
    async () => {

        console.log(
            "========================================"
        );

        console.log(
            "[Scheduler] Agreement notification job started"
        );

        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        await Agreement.update(
            { status: "EXPIRED", remarks: "Agreement expired; tenant flagged for administrative review" },
            { where: { status: { [Op.in]: ["ACTIVE", "EXPIRING_SOON", "RENEWAL_INITIATED"] }, expiryDate: { [Op.lte]: today } } }
        );

        await generateAgreementReminders();

        await createNotificationsFromReminders();

        await processNotifications();

        console.log(
            "[Scheduler] Agreement notification job completed"
        );

        console.log(
            "========================================"
        );
    };


/*
 * Run every day at 12:00 AM
 */

const startAgreementNotificationScheduler =
    () => {

        cron.schedule(
            "0 0 * * *",
            async () => {

                await runAgreementNotificationScheduler();

            },
            {
                timezone: "Asia/Kolkata"
            }
        );

        console.log(
            "Agreement notification scheduler started"
        );
    };


module.exports = {
    startAgreementNotificationScheduler,
    runAgreementNotificationScheduler
};
