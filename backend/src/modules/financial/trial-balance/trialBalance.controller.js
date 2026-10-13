const service =
    require("./trialBalance.service");

const getTrialBalance = async (req, res) => {

    try {

        const {
            societyId
        } = req.params;

        const {
            accountingPeriodId,
            startDate,
            endDate
        } = req.query;

        const result =
            await service.getTrialBalance({
                societyId,
                accountingPeriodId,
                startDate,
                endDate
            });

        return res.status(200).json({

            success: true,

            message:
                "Trial Balance fetched successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Trial Balance Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message: error.message

        });
    }
};

module.exports = {
    getTrialBalance
};