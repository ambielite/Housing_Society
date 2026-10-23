require("dotenv").config();

const app = require("./app");

const sequelize =
    require("./config/database");
const { pool } = require("./config/db");

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
const startCommunityVotingJob = require("./jobs/communityVoting.job").startCommunityVotingJob;
const startNoticesJob = require("./jobs/notices.job").startNoticesJob;

const PORT =
    process.env.PORT || 5000;

let server;
let shuttingDown = false;

const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received. Closing the HTTP server and database connections...`);

    if (server) {
        await new Promise((resolve) => server.close(resolve));
    }

    await Promise.allSettled([pool.end(), sequelize.close()]);
};

process.on("SIGINT", () => shutdown("SIGINT").finally(() => process.exit(0)));
process.on("SIGTERM", () => shutdown("SIGTERM").finally(() => process.exit(0)));


const startServer = async () => {

    try {

        await sequelize.authenticate();
        await pool.query("SELECT 1");

        console.log(
            "PostgreSQL connected"
        );


        // Apply SQL migrations before startup: npm run db:migrate
        console.log(
            "Database connected; schema managed by SQL migrations"
        );


        server = app.listen(
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
                startCommunityVotingJob();
                startNoticesJob();

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

