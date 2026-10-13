
const cron = require("node-cron");

const {
    Op
} = require("sequelize");

const Notification =
    require("../modules/notifications/notification/notification.model");

const notificationProvider =
    require("../modules/notifications/providers/notification.provider");


// ============================================================
// PROCESS PENDING NOTIFICATIONS
// ============================================================

const processPendingNotifications =
    async () => {

        try {

            console.log(
                "Checking pending notifications..."
            );


            const now = new Date();


            const notifications =
                await Notification.findAll({

                    where: {

                        status: "PENDING",

                        [Op.or]: [

                            {
                                scheduledAt: null
                            },

                            {
                                scheduledAt: {
                                    [Op.lte]: now
                                }
                            }

                        ]
                    },

                    order: [
                        ["priority", "DESC"],
                        ["created_at", "ASC"]
                    ],

                    limit: 50
                });


            if (
                notifications.length === 0
            ) {

                console.log(
                    "No pending notifications found"
                );

                return;
            }


            console.log(
                `${notifications.length} notification(s) found`
            );


            for (
                const notification
                of notifications
            ) {

                try {

                    // ------------------------------------------------
                    // Mark as PROCESSING
                    // ------------------------------------------------

                    await notification.update({

                        status: "PROCESSING"

                    });


                    // ------------------------------------------------
                    // Send through provider
                    // ------------------------------------------------

                    const result =
                        await notificationProvider
                            .sendNotification(
                                notification
                            );


                    if (
                        result &&
                        result.success
                    ) {

                        await notification.update({

                            status: "SENT",

                            sentAt: new Date(),

                            errorMessage: null

                        });


                        console.log(
                            `Notification ${notification.id} sent successfully`
                        );

                    } else {

                        await notification.update({

                            status: "FAILED",

                            failedAt: new Date(),

                            retryCount:
                                notification.retryCount + 1,

                            errorMessage:
                                "Provider failed to send notification"

                        });

                    }


                } catch (error) {

                    console.error(
                        `Notification ${notification.id} failed:`,
                        error.message
                    );


                    await notification.update({

                        status: "FAILED",

                        failedAt: new Date(),

                        retryCount:
                            notification.retryCount + 1,

                        errorMessage:
                            error.message

                    });

                }
            }


        } catch (error) {

            console.error(
                "Notification job failed:",
                error.message
            );
        }
    };


// ============================================================
// START CRON JOB
// ============================================================
//
// Runs every minute.
//
// * * * * *
// │ │ │ │ │
// │ │ │ │ └── Day of week
// │ │ │ └──── Month
// │ │ └────── Day of month
// │ └──────── Hour
// └────────── Minute
//
// ============================================================

const startNotificationJob =
    () => {

        cron.schedule(
            "* * * * *",
            async () => {

                await processPendingNotifications();

            }
        );


        console.log(
            "Notification job started"
        );

        console.log(
            "Notification job runs every minute"
        );
    };


module.exports = {
    startNotificationJob,
    processPendingNotifications
};
