const cron =
    require("node-cron");

const BillingConfig =
    require("../billing-config/billingConfig.model");

const service =
    require("./billingScheduler.service");

const { Op } =
    require("sequelize");


const startBillingScheduler = () => {

    /*
     * Runs every day at 02:00 AM.
     *
     * The service itself checks
     * billingDay, so running daily
     * is safe.
     */

    cron.schedule(
        "0 2 * * *",
        async () => {

            try {

                const billingDate =
                    new Date()
                        .toISOString()
                        .split("T")[0];

                console.log(
                    `Billing scheduler started for ${billingDate}`
                );

                const cycles =
                    await BillingConfig.findAll({

                        where: {

                            configType:
                                "BILLING_CYCLE",

                            isActive: true,

                            effectiveFrom: {
                                [Op.lte]:
                                    billingDate
                            },

                            [Op.or]: [

                                {
                                    effectiveTo:
                                        null
                                },

                                {
                                    effectiveTo: {
                                        [Op.gte]:
                                            billingDate
                                    }
                                }

                            ]
                        }
                    });


                const societyIds =
                    [
                        ...new Set(
                            cycles.map(
                                cycle =>
                                    cycle.societyId
                            )
                        )
                    ];


                for (
                    const societyId
                    of societyIds
                ) {

                    try {

                        const result =
                            await service
                                .runBillingForSociety({

                                    societyId,

                                    billingDate
                                });

                        console.log(
                            "Billing result:",
                            JSON.stringify(
                                result
                            )
                        );

                    } catch (
                        error
                    ) {

                        console.error(

                            `Billing failed for society ${societyId}:`,

                            error.message
                        );
                    }
                }

                console.log(
                    "Billing scheduler completed"
                );

            } catch (
                error
            ) {

                console.error(
                    "Billing scheduler failed:",
                    error
                );
            }
        }
    );

    console.log(
        "Billing scheduler started"
    );
};


module.exports =
    startBillingScheduler;