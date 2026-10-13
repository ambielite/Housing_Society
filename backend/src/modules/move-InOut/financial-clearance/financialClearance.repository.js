const FinancialClearance = require("./financialClearance.model");


const create = async (data) => {
    return await FinancialClearance.create(data);
};


const findAll = async () => {
    return await FinancialClearance.findAll({
        order: [["created_at", "DESC"]]
    });
};


const findById = async (id) => {
    return await FinancialClearance.findByPk(id);
};


const findPending = async () => {
    return await FinancialClearance.findAll({
        where: {
            clearanceStatus: "PENDING"
        },
        order: [["created_at", "ASC"]]
    });
};


const findByLifecycle = async (lifecycleId) => {
    return await FinancialClearance.findAll({
        where: {
            lifecycleId
        },
        order: [["created_at", "DESC"]]
    });
};


const findCurrentByLifecycle = async (lifecycleId) => {
    return await FinancialClearance.findOne({
        where: {
            lifecycleId
        },
        order: [["created_at", "DESC"]]
    });
};


const update = async (id, data) => {

    const clearance =
        await FinancialClearance.findByPk(id);

    if (!clearance) {
        return null;
    }

    await clearance.update(data);

    return clearance;
};


const deleteById = async (id) => {

    const clearance =
        await FinancialClearance.findByPk(id);

    if (!clearance) {
        return null;
    }

    await clearance.destroy();

    return clearance;
};


module.exports = {
    create,
    findAll,
    findById,
    findPending,
    findByLifecycle,
    findCurrentByLifecycle,
    update,
    deleteById
};