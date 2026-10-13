const GatePass = require("./gatePass.model");

const create = async (data) => {
    return await GatePass.create(data);
};

const findAll = async () => {
    return await GatePass.findAll({
        order: [["created_at", "DESC"]]
    });
};

const findById = async (id) => {
    return await GatePass.findByPk(id);
};

const findByPassCode = async (passCode) => {
    return await GatePass.findOne({
        where: {
            passCode
        }
    });
};

const findActive = async () => {
    return await GatePass.findAll({
        where: {
            status: "ACTIVE"
        },
        order: [["created_at", "DESC"]]
    });
};

const findByLifecycle = async (
    lifecycleType,
    lifecycleId
) => {
    return await GatePass.findAll({
        where: {
            lifecycleType,
            lifecycleId
        },
        order: [["created_at", "DESC"]]
    });
};

const update = async (id, data) => {
    const gatePass = await GatePass.findByPk(id);

    if (!gatePass) {
        return null;
    }

    await gatePass.update(data);

    return gatePass;
};

const deleteById = async (id) => {
    const gatePass = await GatePass.findByPk(id);

    if (!gatePass) {
        return null;
    }

    await gatePass.destroy();

    return gatePass;
};

module.exports = {
    create,
    findAll,
    findById,
    findByPassCode,
    findActive,
    findByLifecycle,
    update,
    deleteById
};