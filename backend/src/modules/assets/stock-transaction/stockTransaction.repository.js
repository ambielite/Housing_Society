
const StockTransaction =
    require("./stockTransaction.model");

const create = async (data, options = {}) => {
    return await StockTransaction.create(
        data,
        options
    );
};

const findAll = async (
    where = {},
    options = {}
) => {
    return await StockTransaction.findAll({
        where,
        order: [
            ["transactionDate", "DESC"],
            ["created_at", "DESC"]
        ],
        ...options
    });
};

const findById = async (
    id,
    options = {}
) => {
    return await StockTransaction.findByPk(
        id,
        options
    );
};

const findByInventoryId = async (
    inventoryId,
    options = {}
) => {
    return await StockTransaction.findAll({
        where: {
            inventoryId
        },
        order: [
            ["transactionDate", "DESC"],
            ["created_at", "DESC"]
        ],
        ...options
    });
};

const update = async (
    transaction,
    data,
    options = {}
) => {
    return await transaction.update(
        data,
        options
    );
};

const deleteTransaction = async (
    transaction,
    options = {}
) => {
    return await transaction.destroy(
        options
    );
};

module.exports = {
    create,
    findAll,
    findById,
    findByInventoryId,
    update,
    deleteTransaction
};

