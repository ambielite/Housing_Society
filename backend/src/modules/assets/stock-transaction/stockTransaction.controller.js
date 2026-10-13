
const stockTransactionService =
    require("./stockTransaction.service");


const createStockIn = async (
    req,
    res
) => {

    try {

        const transaction =
            await stockTransactionService.createStockIn(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Stock added successfully",
            data: transaction
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const createStockOut = async (
    req,
    res
) => {

    try {

        const transaction =
            await stockTransactionService.createStockOut(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Stock removed successfully",
            data: transaction
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const createTransfer = async (
    req,
    res
) => {

    try {

        const transaction =
            await stockTransactionService.createTransfer(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Stock transferred successfully",
            data: transaction
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const createAdjustment = async (
    req,
    res
) => {

    try {

        const transaction =
            await stockTransactionService.createAdjustment(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Stock adjusted successfully",
            data: transaction
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const createReturn = async (
    req,
    res
) => {

    try {

        const transaction =
            await stockTransactionService.createReturn(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Stock return recorded successfully",
            data: transaction
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAllTransactions = async (
    req,
    res
) => {

    try {

        const transactions =
            await stockTransactionService.getAllTransactions(
                req.query
            );

        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getTransactionById = async (
    req,
    res
) => {

    try {

        const transaction =
            await stockTransactionService.getTransactionById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: transaction
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const getTransactionsByInventoryId = async (
    req,
    res
) => {

    try {

        const transactions =
            await stockTransactionService
                .getTransactionsByInventoryId(
                    req.params.inventoryId
                );

        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const deleteTransaction = async (
    req,
    res
) => {

    try {

        await stockTransactionService.deleteTransaction(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message:
                "Stock transaction deleted successfully"
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createStockIn,
    createStockOut,
    createTransfer,
    createAdjustment,
    createReturn,
    getAllTransactions,
    getTransactionById,
    getTransactionsByInventoryId,
    deleteTransaction
};

