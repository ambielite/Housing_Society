const service =
    require("./billingScheduler.service");


const runBilling = async (
    req,
    res
) => {

    try {

        const {
            societyId,
            billingDate
        } = req.body;

        if (!societyId) {

            return res.status(400).json({

                success: false,

                message:
                    "societyId is required"
            });
        }

        const date =
            billingDate ||
            new Date()
                .toISOString()
                .split("T")[0];

        const result =
            await service.runBillingForSociety({

                societyId,

                billingDate:
                    date
            });

        return res.json(result);

    } catch (error) {

        console.error(
            "Billing scheduler error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


module.exports = {
    runBilling
};