
const express = require("express");

const router = express.Router();

const stockTransactionController =
    require("./stockTransaction.controller");


// Stock In
router.post(
    "/stock-in",
    stockTransactionController.createStockIn
);


// Stock Out
router.post(
    "/stock-out",
    stockTransactionController.createStockOut
);


// Transfer
router.post(
    "/transfer",
    stockTransactionController.createTransfer
);


// Adjustment
router.post(
    "/adjustment",
    stockTransactionController.createAdjustment
);


// Return
router.post(
    "/return",
    stockTransactionController.createReturn
);


// Get all transactions
router.get(
    "/",
    stockTransactionController.getAllTransactions
);


// Get transactions for inventory
router.get(
    "/inventory/:inventoryId",
    stockTransactionController
        .getTransactionsByInventoryId
);


// Get transaction by ID
router.get(
    "/:id",
    stockTransactionController.getTransactionById
);


// Delete transaction
router.delete(
    "/:id",
    stockTransactionController.deleteTransaction
);


module.exports = router;

