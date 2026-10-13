
const AssetMaintenance =
    require("./assetMaintenance.model");

const create = async (data) => {
    return await AssetMaintenance.create(data);
};

const findAll = async (where = {}) => {
    return await AssetMaintenance.findAll({
        where,
        order: [
            ["serviceDate", "DESC"],
            ["created_at", "DESC"]
        ]
    });
};

const findById = async (id) => {
    return await AssetMaintenance.findByPk(id);
};

const findByAssetId = async (assetId) => {
    return await AssetMaintenance.findAll({
        where: {
            assetId
        },
        order: [
            ["serviceDate", "DESC"],
            ["created_at", "DESC"]
        ]
    });
};

const update = async (maintenance, data) => {
    return await maintenance.update(data);
};

const deleteMaintenance = async (maintenance) => {
    return await maintenance.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    findByAssetId,
    update,
    deleteMaintenance
};

