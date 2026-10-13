
const cron =
    require("node-cron");

const assetLifecycleService =
    require("../modules/assets/asset-lifecycle/assetLifecycle.service");


const startAssetLifecycleJob = () => {

    // Runs every day at 9:00 AM
    cron.schedule(
        "0 9 * * *",
        async () => {

            try {

                console.log(
                    "Running asset lifecycle reminder job..."
                );


                const reminderResult =
                    await assetLifecycleService
                        .processDueReminders();


                const expiredResult =
                    await assetLifecycleService
                        .markExpiredReminders();


                console.log(
                    "Asset lifecycle job completed"
                );


                console.log(
                    "Reminders processed:",
                    reminderResult.processedCount
                );


                console.log(
                    "Reminders expired:",
                    expiredResult.expiredCount
                );

            } catch (error) {

                console.error(
                    "Asset lifecycle job failed:",
                    error.message
                );
            }
        }
    );


    console.log(
        "Asset lifecycle cron job started"
    );
};


module.exports =
    startAssetLifecycleJob;

