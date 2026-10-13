
const AssetLifecycle =
    require("./assetLifecycle.model");


const create = async (data) => {

    return await AssetLifecycle.create(
        data
    );
};


const findAll = async (
    where = {}
) => {

    return await AssetLifecycle.findAll({
        where,

        order: [
            ["dueDate", "ASC"],
            ["created_at", "DESC"]
        ]
    });
};


const findById = async (
    id
) => {

    return await AssetLifecycle.findByPk(
        id
    );
};


const findByAssetId = async (
    assetId
) => {

    return await AssetLifecycle.findAll({

        where: {
            assetId
        },

        order: [
            ["created_at", "DESC"]
        ]
    });
};


const findPendingReminders = async (
    where
) => {

    return await AssetLifecycle.findAll({
        where,

        order: [
            ["reminderDate", "ASC"]
        ]
    });
};


const update = async (
    lifecycle,
    data
) => {

    return await lifecycle.update(
        data
    );
};


const deleteLifecycle = async (
    lifecycle
) => {

    return await lifecycle.destroy();
};


module.exports = {
    create,
    findAll,
    findById,
    findByAssetId,
    findPendingReminders,
    update,
    deleteLifecycle
};

