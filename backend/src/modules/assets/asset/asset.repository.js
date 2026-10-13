const Asset = require("./asset.model");

const create = async (data) => {
    return await Asset.create(data);
};

const findAll = async (where = {}) => {
    return await Asset.findAll({
        where,
        order: [
            ["created_at", "DESC"]
        ]
    });
};

const findById = async (id) => {
    return await Asset.findByPk(id);
};

const findByAssetCode = async (societyId, assetCode) => {
    return await Asset.findOne({
        where: {
            societyId,
            assetCode
        }
    });
};

const update = async (asset, data) => {
    return await asset.update(data);
};

const deleteAsset = async (asset) => {
    return await asset.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    findByAssetCode,
    update,
    deleteAsset
};