const MoveOut = require("./moveOut.model");

const create = async (data, transaction = null) => {
    return await MoveOut.create(data, transaction ? { transaction } : undefined);
};

const findAll = async () => {
    return await MoveOut.findAll({
        order: [["created_at", "DESC"]]
    });
};

const findById = async (id, options = {}) => {
    const queryOptions = {};
    if (options.transaction) queryOptions.transaction = options.transaction;
    if (options.lock && options.transaction) queryOptions.lock = options.transaction.LOCK.UPDATE;
    return await MoveOut.findByPk(id, queryOptions);
};

const findBySociety = async (societyId) => {
    return await MoveOut.findAll({
        where: { societyId },
        order: [["created_at", "DESC"]]
    });
};

const findByUnit = async (unitId) => {
    return await MoveOut.findAll({
        where: { unitId },
        order: [["created_at", "DESC"]]
    });
};

const findByResident = async (residentId) => {
    return await MoveOut.findAll({
        where: { residentId },
        order: [["created_at", "DESC"]]
    });
};

const findByStatus = async (status) => {
    return await MoveOut.findAll({
        where: { status },
        order: [["created_at", "DESC"]]
    });
};

const findPendingReview = async () => {
    return await MoveOut.findAll({
        where: {
            status: [
                "REQUESTED",
                "CHECKLIST_PENDING",
                "DUES_PENDING",
                "FINANCIAL_CLEARANCE_PENDING",
                "UNDER_VERIFICATION"
            ]
        },
        order: [["created_at", "DESC"]]
    });
};

const update = async (id, data, transaction = null) => {
    const moveOut = await MoveOut.findByPk(id, transaction ? { transaction, lock: transaction.LOCK.UPDATE } : undefined);

    if (!moveOut) {
        return null;
    }

    await moveOut.update(data, transaction ? { transaction } : undefined);

    return moveOut;
};

const deleteById = async (id) => {
    const moveOut = await MoveOut.findByPk(id);
    if (!moveOut) return null;
    await moveOut.destroy();
    return moveOut;
};

module.exports = {
    create,
    findAll,
    findById,
    findBySociety,
    findByUnit,
    findByResident,
    findByStatus,
    findPendingReview,
    update,
    deleteById
};
