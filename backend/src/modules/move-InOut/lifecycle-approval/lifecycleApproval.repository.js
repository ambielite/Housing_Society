const LifecycleApproval = require("./lifecycleApproval.model");

const create = async (data) => {
    return await LifecycleApproval.create(data);
};

const findAll = async () => {
    return await LifecycleApproval.findAll({
        order: [["created_at", "DESC"]]
    });
};

const findById = async (id) => {
    return await LifecycleApproval.findByPk(id);
};

const findPending = async () => {
    return await LifecycleApproval.findAll({
        where: {
            status: "PENDING"
        },
        order: [["created_at", "ASC"]]
    });
};

const findByLifecycle = async (lifecycleType, lifecycleId) => {
    return await LifecycleApproval.findAll({
        where: {
            lifecycleType,
            lifecycleId
        },
        order: [["created_at", "ASC"]]
    });
};

const update = async (id, data) => {
    const approval = await LifecycleApproval.findByPk(id);

    if (!approval) {
        return null;
    }

    await approval.update(data);

    return approval;
};

const deleteById = async (id) => {
    const approval = await LifecycleApproval.findByPk(id);

    if (!approval) {
        return null;
    }

    await approval.destroy();

    return approval;
};

module.exports = {
    create,
    findAll,
    findById,
    findPending,
    findByLifecycle,
    update,
    deleteById
};