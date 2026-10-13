const service =
    require("./financialReport.service");


const getIncomeExpense = async (req, res) => {

    try {

        const { societyId } =
            req.params;

        const {
            accountingPeriodId,
            startDate,
            endDate
        } = req.query;

        const result =
            await service.getIncomeExpenseReport({
                societyId,
                accountingPeriodId,
                startDate,
                endDate
            });

        return res.status(200).json({

            success: true,

            message:
                "Income and Expense report fetched successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Income Expense Report Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message: error.message

        });
    }
};


const getBalanceSheet = async (req, res) => {

    try {

        const { societyId } =
            req.params;

        const {
            accountingPeriodId,
            startDate,
            endDate
        } = req.query;

        const result =
            await service.getBalanceSheet({
                societyId,
                accountingPeriodId,
                startDate,
                endDate
            });

        return res.status(200).json({

            success: true,

            message:
                "Balance Sheet fetched successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Balance Sheet Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message: error.message

        });
    }
};


const getTrialBalanceSummary =
    async (req, res) => {

        try {

            const { societyId } =
                req.params;

            const {
                accountingPeriodId,
                startDate,
                endDate
            } = req.query;

            const result =
                await service.getTrialBalanceSummary({
                    societyId,
                    accountingPeriodId,
                    startDate,
                    endDate
                });

            return res.status(200).json({

                success: true,

                message:
                    "Trial Balance summary fetched successfully",

                data: result

            });

        } catch (error) {

            console.error(
                "Trial Balance Summary Error:",
                error
            );

            return res.status(400).json({

                success: false,

                message: error.message

            });
        }
    };


const getAccountReport =
    async (req, res) => {

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
                await service.getAccountReport({
                    societyId,
                    accountId,
                    accountingPeriodId,
                    startDate,
                    endDate
                });

            return res.status(200).json({

                success: true,

                message:
                    "Account financial report fetched successfully",

                data: result

            });

        } catch (error) {

            console.error(
                "Account Report Error:",
                error
            );

            return res.status(400).json({

                success: false,

                message: error.message

            });
        }
    };


module.exports = {

    getIncomeExpense,

    getBalanceSheet,

    getTrialBalanceSummary,

    getAccountReport

};