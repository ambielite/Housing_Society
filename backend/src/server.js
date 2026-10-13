require("dotenv").config();

const app = require("./app");

const sequelize =
    require("./config/database");

require("./config/models");

const {
    startAgreementNotificationScheduler
} =
    require("./modules/move-InOut/agreement-notification/agreementNotification.scheduler");

const startBillingScheduler =
    require(
        "./modules/financial/billing-scheduler/billingScheduler.cron"
    );

const startAssetLifecycleJob =
    require("./jobs/assetLifecycle.job");

const startMoveOutEffectiveDateJob =
    require("./jobs/moveOutEffectiveDate.job").startMoveOutEffectiveDateJob;

const startNotificationJob =
    require("./jobs/notification.job").startNotificationJob;

const PORT =
    process.env.PORT || 5000;


const startServer = async () => {

    try {

        await sequelize.authenticate();

        console.log(
            "PostgreSQL connected"
        );


        // Apply SQL migrations before startup: npm run db:migrate
        console.log(
            "Database connected; schema managed by SQL migrations"
        );


        app.listen(
            PORT,
            () => {

                console.log(
                    `Server running on http://localhost:${PORT}`
                );

                startAgreementNotificationScheduler();
                startBillingScheduler();
                startAssetLifecycleJob();
                startMoveOutEffectiveDateJob();
                startNotificationJob();

            }
        );

    } catch (error) {

        console.error(
            "Server startup failed:",
            error
        );
    }
};


startServer();

