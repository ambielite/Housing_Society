const LifecycleDocument = require("./lifecycleDocument.model");

const create = async (data) => {
    return await LifecycleDocument.create(data);
};

const findAll = async () => {
    return await LifecycleDocument.findAll({
        order: [["created_at", "DESC"]]
    });
};

const findById = async (id) => {
    return await LifecycleDocument.findByPk(id);
};

const findByLifecycle = async (
    lifecycleType,
    lifecycleId
) => {
    return await LifecycleDocument.findAll({
        where: {
            lifecycleType,
            lifecycleId
        },
        order: [["created_at", "DESC"]]
    });
};

const findPending = async () => {
    return await LifecycleDocument.findAll({
        where: {
            status: "PENDING_VERIFICATION"
        },
        order: [["created_at", "ASC"]]
    });
};

const update = async (id, data) => {
    const document =
        await LifecycleDocument.findByPk(id);

    if (!document) {
        return null;
    }

    await document.update(data);

    return document;
};

const deleteById = async (id) => {
    const document =
        await LifecycleDocument.findByPk(id);

    if (!document) {
        return null;
    }

    await document.destroy();

    return document;
};

module.exports = {
    create,
    findAll,
    findById,
    findByLifecycle,
    findPending,
    update,
    deleteById
};