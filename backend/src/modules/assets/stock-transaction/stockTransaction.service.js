
const { Op } = require("sequelize");

const sequelize =
    require("../../../config/database");

const Inventory =
    require("../inventory/inventory.model");

const transactionRepository =
    require("./stockTransaction.repository");

const {
    validateCreateTransaction
} = require("./stockTransaction.validation");


const generateTransactionNumber = (
    transactionType
) => {

    const prefixMap = {
        STOCK_IN: "SIN",
        STOCK_OUT: "SOUT",
        TRANSFER: "TRF",
        ADJUSTMENT: "ADJ",
        RETURN: "RET"
    };

    const prefix =
        prefixMap[transactionType] ||
        "STK";

    const timestamp =
        Date.now();

    const random =
        Math.floor(
            1000 + Math.random() * 9000
        );

    return `${prefix}-${timestamp}-${random}`;
};


const createStockIn = async (data) => {

    const transactionData = {
        ...data,
        transactionType: "STOCK_IN"
    };

    const errors =
        validateCreateTransaction(
            transactionData
        );

    if (errors.length > 0) {
        throw new Error(
            errors.join(", ")
        );
    }

    const transaction =
        await sequelize.transaction();

    try {

        const inventory =
            await Inventory.findByPk(
                data.inventoryId,
                {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                }
            );

        if (!inventory) {
            throw new Error(
                "Inventory item not found"
            );
        }

        if (
            inventory.status === "INACTIVE"
        ) {
            throw new Error(
                "Cannot add stock to inactive inventory item"
            );
        }

        const quantity =
            Number(data.quantity);

        const previousStock =
            Number(inventory.currentStock);

        const newStock =
            previousStock + quantity;

        const transactionRecord =
            await transactionRepository.create(
                {
                    transactionNumber:
                        generateTransactionNumber(
                            "STOCK_IN"
                        ),

                    inventoryId:
                        inventory.id,

                    transactionType:
                        "STOCK_IN",

                    quantity,

                    previousStock,

                    newStock,

                    referenceNumber:
                        data.referenceNumber,

                    referenceType:
                        data.referenceType,

                    reason:
                        data.reason,

                    transactionDate:
                        data.transactionDate ||
                        new Date(),

                    performedBy:
                        data.performedBy,

                    remarks:
                        data.remarks
                },
                {
                    transaction
                }
            );

        await inventory.update(
            {
                currentStock: newStock,
                lastStockInDate:
                    data.transactionDate ||
                    new Date()
            },
            {
                transaction
            }
        );

        await transaction.commit();

        return transactionRecord;

    } catch (error) {

        await transaction.rollback();

        throw error;
    }
};


const createStockOut = async (data) => {

    const transactionData = {
        ...data,
        transactionType: "STOCK_OUT"
    };

    const errors =
        validateCreateTransaction(
            transactionData
        );

    if (errors.length > 0) {
        throw new Error(
            errors.join(", ")
        );
    }

    const transaction =
        await sequelize.transaction();

    try {

        const inventory =
            await Inventory.findByPk(
                data.inventoryId,
                {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                }
            );

        if (!inventory) {
            throw new Error(
                "Inventory item not found"
            );
        }

        if (
            inventory.status === "INACTIVE"
        ) {
            throw new Error(
                "Cannot remove stock from inactive inventory item"
            );
        }

        const quantity =
            Number(data.quantity);

        const previousStock =
            Number(inventory.currentStock);

        if (
            quantity > previousStock
        ) {
            throw new Error(
                `Insufficient stock. Available stock: ${previousStock}`
            );
        }

        const newStock =
            previousStock - quantity;

        const transactionRecord =
            await transactionRepository.create(
                {
                    transactionNumber:
                        generateTransactionNumber(
                            "STOCK_OUT"
                        ),

                    inventoryId:
                        inventory.id,

                    transactionType:
                        "STOCK_OUT",

                    quantity,

                    previousStock,

                    newStock,

                    referenceNumber:
                        data.referenceNumber,

                    referenceType:
                        data.referenceType,

                    reason:
                        data.reason,

                    transactionDate:
                        data.transactionDate ||
                        new Date(),

                    performedBy:
                        data.performedBy,

                    remarks:
                        data.remarks
                },
                {
                    transaction
                }
            );

        await inventory.update(
            {
                currentStock: newStock,
                lastStockOutDate:
                    data.transactionDate ||
                    new Date()
            },
            {
                transaction
            }
        );

        await transaction.commit();

        return transactionRecord;

    } catch (error) {

        await transaction.rollback();

        throw error;
    }
};


const createReturn = async (data) => {

    const transactionData = {
        ...data,
        transactionType: "RETURN"
    };

    const errors =
        validateCreateTransaction(
            transactionData
        );

    if (errors.length > 0) {
        throw new Error(
            errors.join(", ")
        );
    }

    const transaction =
        await sequelize.transaction();

    try {

        const inventory =
            await Inventory.findByPk(
                data.inventoryId,
                {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                }
            );

        if (!inventory) {
            throw new Error(
                "Inventory item not found"
            );
        }

        if (
            inventory.status === "INACTIVE"
        ) {
            throw new Error(
                "Cannot return stock to inactive inventory item"
            );
        }

        const quantity =
            Number(data.quantity);

        const previousStock =
            Number(inventory.currentStock);

        const newStock =
            previousStock + quantity;

        const transactionRecord =
            await transactionRepository.create(
                {
                    transactionNumber:
                        generateTransactionNumber(
                            "RETURN"
                        ),

                    inventoryId:
                        inventory.id,

                    transactionType:
                        "RETURN",

                    quantity,

                    previousStock,

                    newStock,

                    referenceNumber:
                        data.referenceNumber,

                    referenceType:
                        data.referenceType,

                    reason:
                        data.reason,

                    transactionDate:
                        data.transactionDate ||
                        new Date(),

                    performedBy:
                        data.performedBy,

                    remarks:
                        data.remarks
                },
                {
                    transaction
                }
            );

        await inventory.update(
            {
                currentStock: newStock,
                lastStockInDate:
                    data.transactionDate ||
                    new Date()
            },
            {
                transaction
            }
        );

        await transaction.commit();

        return transactionRecord;

    } catch (error) {

        await transaction.rollback();

        throw error;
    }
};


const createAdjustment = async (data) => {

    if (!data.inventoryId) {
        throw new Error(
            "inventoryId is required"
        );
    }

    if (
        data.newStock === undefined ||
        data.newStock === null
    ) {
        throw new Error(
            "newStock is required for adjustment"
        );
    }

    const newStock =
        Number(data.newStock);

    if (
        Number.isNaN(newStock) ||
        newStock < 0
    ) {
        throw new Error(
            "newStock must be a valid non-negative number"
        );
    }

    const transaction =
        await sequelize.transaction();

    try {

        const inventory =
            await Inventory.findByPk(
                data.inventoryId,
                {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                }
            );

        if (!inventory) {
            throw new Error(
                "Inventory item not found"
            );
        }

        const previousStock =
            Number(inventory.currentStock);

        const difference =
            newStock - previousStock;

        if (difference === 0) {
            throw new Error(
                "Adjustment quantity cannot be zero"
            );
        }

        const transactionRecord =
            await transactionRepository.create(
                {
                    transactionNumber:
                        generateTransactionNumber(
                            "ADJUSTMENT"
                        ),

                    inventoryId:
                        inventory.id,

                    transactionType:
                        "ADJUSTMENT",

                    quantity:
                        Math.abs(difference),

                    previousStock,

                    newStock,

                    referenceNumber:
                        data.referenceNumber,

                    referenceType:
                        data.referenceType,

                    reason:
                        data.reason,

                    transactionDate:
                        data.transactionDate ||
                        new Date(),

                    performedBy:
                        data.performedBy,

                    remarks:
                        data.remarks
                },
                {
                    transaction
                }
            );

        await inventory.update(
            {
                currentStock: newStock
            },
            {
                transaction
            }
        );

        await transaction.commit();

        return transactionRecord;

    } catch (error) {

        await transaction.rollback();

        throw error;
    }
};


const createTransfer = async (data) => {

    if (!data.sourceInventoryId) {
        throw new Error(
            "sourceInventoryId is required"
        );
    }

    if (!data.destinationInventoryId) {
        throw new Error(
            "destinationInventoryId is required"
        );
    }

    if (
        data.sourceInventoryId ===
        data.destinationInventoryId
    ) {
        throw new Error(
            "Source and destination inventory cannot be the same"
        );
    }

    if (
        data.quantity === undefined ||
        Number(data.quantity) <= 0
    ) {
        throw new Error(
            "quantity must be a positive number"
        );
    }

    const quantity =
        Number(data.quantity);

    const transaction =
        await sequelize.transaction();

    try {

        const sourceInventory =
            await Inventory.findByPk(
                data.sourceInventoryId,
                {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                }
            );

        if (!sourceInventory) {
            throw new Error(
                "Source inventory item not found"
            );
        }

        const destinationInventory =
            await Inventory.findByPk(
                data.destinationInventoryId,
                {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                }
            );

        if (!destinationInventory) {
            throw new Error(
                "Destination inventory item not found"
            );
        }

        if (
            sourceInventory.status ===
            "INACTIVE"
        ) {
            throw new Error(
                "Source inventory item is inactive"
            );
        }

        if (
            destinationInventory.status ===
            "INACTIVE"
        ) {
            throw new Error(
                "Destination inventory item is inactive"
            );
        }

        const sourcePreviousStock =
            Number(
                sourceInventory.currentStock
            );

        if (
            quantity > sourcePreviousStock
        ) {
            throw new Error(
                `Insufficient stock in source inventory. Available stock: ${sourcePreviousStock}`
            );
        }

        const destinationPreviousStock =
            Number(
                destinationInventory.currentStock
            );

        const sourceNewStock =
            sourcePreviousStock -
            quantity;

        const destinationNewStock =
            destinationPreviousStock +
            quantity;

        const transactionNumber =
            generateTransactionNumber(
                "TRANSFER"
            );

        const sourceRecord =
            await transactionRepository.create(
                {
                    transactionNumber,

                    inventoryId:
                        sourceInventory.id,

                    transactionType:
                        "TRANSFER",

                    quantity,

                    previousStock:
                        sourcePreviousStock,

                    newStock:
                        sourceNewStock,

                    sourceInventoryId:
                        sourceInventory.id,

                    destinationInventoryId:
                        destinationInventory.id,

                    referenceNumber:
                        data.referenceNumber,

                    referenceType:
                        data.referenceType,

                    reason:
                        data.reason,

                    transactionDate:
                        data.transactionDate ||
                        new Date(),

                    performedBy:
                        data.performedBy,

                    remarks:
                        data.remarks
                },
                {
                    transaction
                }
            );

        await sourceInventory.update(
            {
                currentStock:
                    sourceNewStock,

                lastStockOutDate:
                    data.transactionDate ||
                    new Date()
            },
            {
                transaction
            }
        );

        await transactionRepository.create(
            {
                transactionNumber:
                    `${transactionNumber}-DEST`,

                inventoryId:
                    destinationInventory.id,

                transactionType:
                    "TRANSFER",

                quantity,

                previousStock:
                    destinationPreviousStock,

                newStock:
                    destinationNewStock,

                sourceInventoryId:
                    sourceInventory.id,

                destinationInventoryId:
                    destinationInventory.id,

                referenceNumber:
                    data.referenceNumber,

                referenceType:
                    data.referenceType,

                reason:
                    data.reason,

                transactionDate:
                    data.transactionDate ||
                    new Date(),

                performedBy:
                    data.performedBy,

                remarks:
                    data.remarks
            },
            {
                transaction
            }
        );

        await destinationInventory.update(
            {
                currentStock:
                    destinationNewStock,

                lastStockInDate:
                    data.transactionDate ||
                    new Date()
            },
            {
                transaction
            }
        );

        await transaction.commit();

        return sourceRecord;

    } catch (error) {

        await transaction.rollback();

        throw error;
    }
};


const getAllTransactions = async (
    filters = {}
) => {

    const where = {};

    if (filters.inventoryId) {
        where.inventoryId =
            filters.inventoryId;
    }

    if (filters.transactionType) {
        where.transactionType =
            filters.transactionType;
    }

    if (filters.referenceNumber) {
        where.referenceNumber =
            filters.referenceNumber;
    }

    return await transactionRepository.findAll(
        where
    );
};


const getTransactionById = async (id) => {

    const transaction =
        await transactionRepository.findById(
            id
        );

    if (!transaction) {
        throw new Error(
            "Stock transaction not found"
        );
    }

    return transaction;
};


const getTransactionsByInventoryId = async (
    inventoryId
) => {

    const inventory =
        await Inventory.findByPk(
            inventoryId
        );

    if (!inventory) {
        throw new Error(
            "Inventory item not found"
        );
    }

    return await transactionRepository.findByInventoryId(
        inventoryId
    );
};


const deleteTransaction = async (id) => {

    const transaction =
        await transactionRepository.findById(
            id
        );

    if (!transaction) {
        throw new Error(
            "Stock transaction not found"
        );
    }

    /*
     * IMPORTANT:
     * Transactions are audit records.
     *
     * We do not allow deleting them because
     * deleting a transaction would break
     * stock history.
     */

    throw new Error(
        "Stock transactions cannot be deleted because they are audit records"
    );
};


module.exports = {
    createStockIn,
    createStockOut,
    createReturn,
    createAdjustment,
    createTransfer,
    getAllTransactions,
    getTransactionById,
    getTransactionsByInventoryId,
    deleteTransaction
};

