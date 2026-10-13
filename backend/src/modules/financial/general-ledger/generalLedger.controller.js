const service = require("./generalLedger.service");


const getGeneralLedger = async (req, res) => {

    try {

        const {
            societyId
        } = req.params;

        const {
            accountId,
            accountingPeriodId,
            startDate,
            endDate
        } = req.query;

        const result =
            await service.getGeneralLedger({
                societyId,
                accountId,
                accountingPeriodId,
                startDate,
                endDate
            });

        return res.status(200).json({

            success: true,

            message:
                "General Ledger fetched successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Get General Ledger Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message: error.message

        });
    }
};


const getAccountLedger = async (req, res) => {

    try {

        const {
            societyId,
            accountId
        } = req.params;

        const {
            accountingPeriodId,
            startDate,
            endDate
        } = req.query;

        const result =
            await service.getAccountLedger({

                societyId,

                accountId,

                accountingPeriodId,

                startDate,

                endDate
            });

        return res.status(200).json({

            success: true,

            message:
                "Account Ledger fetched successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Get Account Ledger Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message: error.message

        });
    }
};


const getAccountSummary = async (req, res) => {

    try {

        const {
            societyId,
            accountId
        } = req.params;

        const {
            accountingPeriodId,
            startDate,
            endDate
        } = req.query;

        const result =
            await service.getAccountSummary({

                societyId,

                accountId,

                accountingPeriodId,

                startDate,

                endDate
            });

        return res.status(200).json({

            success: true,

            message:
                "Account Ledger summary fetched successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Get Account Summary Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message: error.message

        });
    }
};


const getPeriodLedger = async (req, res) => {

    try {

        const {
            societyId,
            accountingPeriodId
        } = req.params;

        const result =
            await service.getPeriodLedger({

                societyId,

                accountingPeriodId
            });

        return res.status(200).json({

            success: true,

            message:
                "Period General Ledger fetched successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Get Period Ledger Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message: error.message

        });
    }
};


module.exports = {

    getGeneralLedger,

    getAccountLedger,

    getAccountSummary,

    getPeriodLedger

};