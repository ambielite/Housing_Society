const LifecycleAudit = require("./lifecycleAudit.model");


const create = async (data) => {
    return await LifecycleAudit.create(data);
};


const findAll = async () => {
    return await LifecycleAudit.findAll({
        order: [["performed_at", "DESC"]]
    });
};


const findById = async (id) => {
    return await LifecycleAudit.findByPk(id);
};


const findByLifecycle = async (
    lifecycleType,
    lifecycleId
) => {
    return await LifecycleAudit.findAll({
        where: {
            lifecycleType,
            lifecycleId
        },
        order: [["performed_at", "ASC"]]
    });
};


const findByPerformer = async (performedBy) => {
    return await LifecycleAudit.findAll({
        where: {
            performedBy
        },
        order: [["performed_at", "DESC"]]
    });
};


const findByAction = async (action) => {
    return await LifecycleAudit.findAll({
        where: {
            action
        },
        order: [["performed_at", "DESC"]]
    });
};


const update = async (id, data) => {

    const audit =
        await LifecycleAudit.findByPk(id);

    if (!audit) {
        return null;
    }

    await audit.update(data);

    return audit;
};


const deleteById = async (id) => {

    const audit =
        await LifecycleAudit.findByPk(id);

    if (!audit) {
        return null;
    }

    await audit.destroy();

    return audit;
};


module.exports = {
    create,
    findAll,
    findById,
    findByLifecycle,
    findByPerformer,
    findByAction,
    update,
    deleteById
};