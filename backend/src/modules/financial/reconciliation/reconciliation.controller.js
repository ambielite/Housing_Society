const ReconciliationService =
    require("./reconciliation.service");


const importTransaction = async (
    req,
    res
) => {

    try {

        const result =
            await ReconciliationService
                .importTransaction(
                    req.body
                );

        return res.status(
            result.duplicate
                ? 200
                : 201
        ).json({

            success: true,

            message:
                result.duplicate
                    ? "Duplicate bank transaction"
                    : "Bank transaction imported successfully",

            duplicate:
                result.duplicate,

            data:
                result.reconciliation
        });

    } catch (error) {

        console.error(
            "Import transaction error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const autoMatch = async (
    req,
    res
) => {

    try {

        const result =
            await ReconciliationService
                .autoMatch(
                    req.params.id
                );

        return res.status(200).json({

            success: true,

            message:
                result.matched
                    ? "Payment matched successfully"
                    : result.message,

            data:
                result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const manualMatch = async (
    req,
    res
) => {

    try {

        const result =
            await ReconciliationService
                .manualMatch(
                    req.params.id,
                    req.body.paymentId,
                    req.body.matchedBy
                );

        return res.status(200).json({

            success: true,

            message:
                "Payment manually matched successfully",

            data:
                result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const reconcile = async (
    req,
    res
) => {

    try {

        const result =
            await ReconciliationService
                .reconcile(
                    req.params.id,
                    req.body.reconciledBy,
                    req.body.remarks
                );

        return res.status(200).json({

            success: true,

            message:
                result.alreadyReconciled
                    ? "Transaction already reconciled"
                    : "Transaction reconciled successfully",

            data:
                result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getById = async (
    req,
    res
) => {

    try {

        const result =
            await ReconciliationService
                .getById(
                    req.params.id
                );

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const getAll = async (
    req,
    res
) => {

    try {

        const result =
            await ReconciliationService
                .getAll({
                    societyId:
                        req.query.societyId,

                    status:
                        req.query.status,

                    transactionType:
                        req.query.transactionType
                });

        return res.status(200).json({

            success: true,

            count:
                result.length,

            data:
                result
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const ignoreTransaction = async (
    req,
    res
) => {

    try {

        const result =
            await ReconciliationService
                .ignoreTransaction(
                    req.params.id,
                    req.body.remarks
                );

        return res.status(200).json({

            success: true,

            message:
                "Transaction ignored successfully",

            data:
                result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    importTransaction,
    autoMatch,
    manualMatch,
    reconcile,
    getById,
    getAll,
    ignoreTransaction
};