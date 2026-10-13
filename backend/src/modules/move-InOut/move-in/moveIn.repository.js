const MoveIn = require("./moveIn.model");

const create = async (data) => {
    return await MoveIn.create(data);
};

const findAll = async () => {
    return await MoveIn.findAll({
        order: [["created_at", "DESC"]]
    });
};

const findById = async (id) => {
    return await MoveIn.findByPk(id);
};

const findBySociety = async (societyId) => {
    return await MoveIn.findAll({
        where: { societyId },
        order: [["created_at", "DESC"]]
    });
};

const findByUnit = async (unitId) => {
    return await MoveIn.findAll({
        where: { unitId },
        order: [["created_at", "DESC"]]
    });
};

const findByResident = async (residentId) => {
    return await MoveIn.findAll({
        where: { residentId },
        order: [["created_at", "DESC"]]
    });
};

const findByStatus = async (status) => {
    return await MoveIn.findAll({
        where: { status },
        order: [["created_at", "DESC"]]
    });
};

const findPendingReview = async () => {
    return await MoveIn.findAll({
        where: {
            status: [
                "PENDING_DOCUMENTS",
                "DOCUMENTS_SUBMITTED",
                "UNDER_VERIFICATION",
                "APPROVED",
                "GATE_PASS_ISSUED",
                "LEDGER_CREATED",
                "ACCESS_ACTIVATED"
            ]
        },
        order: [["created_at", "DESC"]]
    });
};

const update = async (id, data) => {
    const moveIn = await MoveIn.findByPk(id);

    if (!moveIn) {
        return null;
    }

    await moveIn.update(data);

    return moveIn;
};

const deleteById = async (id) => {
    const moveIn = await MoveIn.findByPk(id);

    if (!moveIn) {
        return null;
    }

    await moveIn.destroy();

    return moveIn;
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