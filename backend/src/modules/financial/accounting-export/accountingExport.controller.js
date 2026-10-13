const AccountingExportService =
    require("./accountingExport.service");


const exportJournal = async (
    req,
    res
) => {

    try {

        const format =
            (req.query.format || "csv").toLowerCase();

        const result =
            await AccountingExportService
                .exportJournal(
                    {
                        societyId:
                            req.query.societyId,

                        accountingPeriodId:
                            req.query.accountingPeriodId,

                        startDate:
                            req.query.startDate,

                        endDate:
                            req.query.endDate
                    },
                    format
                );

        if (!result?.filePath) {
            return res.status(500).json({
                success: false,
                message: "Journal export failed to generate a file."
            });
        }

        return res.download(result.filePath, result.fileName);

    } catch (error) {

        console.error(
            "Journal export error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


const exportTrialBalance = async (
    req,
    res
) => {

    try {

        const format =
            (req.query.format || "csv").toLowerCase();

        const result =
            await AccountingExportService
                .exportTrialBalance(
                    {
                        societyId:
                            req.query.societyId,

                        accountingPeriodId:
                            req.query.accountingPeriodId,

                        startDate:
                            req.query.startDate,

                        endDate:
                            req.query.endDate
                    },
                    format
                );

        if (!result?.filePath) {
            return res.status(500).json({
                success: false,
                message: "Trial balance export failed to generate a file."
            });
        }

        return res.download(result.filePath, result.fileName);

    } catch (error) {

        console.error(
            "Trial balance export error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


const exportGeneralLedger = async (
    req,
    res
) => {

    try {

        const format =
            (req.query.format || "csv").toLowerCase();

        const result =
            await AccountingExportService
                .exportGeneralLedger(
                    {
                        societyId:
                            req.query.societyId,

                        accountId:
                            req.query.accountId,

                        accountingPeriodId:
                            req.query.accountingPeriodId,

                        startDate:
                            req.query.startDate,

                        endDate:
                            req.query.endDate
                    },
                    format
                );

        if (!result?.filePath) {
            return res.status(500).json({
                success: false,
                message: "General ledger export failed to generate a file."
            });
        }

        return res.download(result.filePath, result.fileName);

    } catch (error) {

        console.error(
            "General ledger export error:",
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
    exportJournal,
    exportTrialBalance,
    exportGeneralLedger
};