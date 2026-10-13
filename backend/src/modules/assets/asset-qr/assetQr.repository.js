
const AssetQr = require("./assetQr.model");


// ======================================================
// CREATE
// ======================================================

const create = async (data) => {

    return await AssetQr.create(data);
};


// ======================================================
// GET ALL
// ======================================================

const findAll = async (where = {}) => {

    return await AssetQr.findAll({
        where,
        order: [
            ["created_at", "DESC"]
        ]
    });
};


// ======================================================
// GET BY ID
// ======================================================

const findById = async (id) => {

    return await AssetQr.findByPk(id);
};


// ======================================================
// GET BY ASSET ID
// ======================================================

const findByAssetId = async (assetId) => {

    return await AssetQr.findOne({
        where: {
            assetId
        }
    });
};


// ======================================================
// GET BY QR CODE
// ======================================================

const findByQrCode = async (qrCode) => {

    return await AssetQr.findOne({
        where: {
            qrCode
        }
    });
};


// ======================================================
// GET BY QR VALUE
// ======================================================

const findByQrValue = async (qrValue) => {

    return await AssetQr.findOne({
        where: {
            qrValue
        }
    });
};


// ======================================================
// UPDATE
// ======================================================

const update = async (qrTag, data) => {

    return await qrTag.update(data);
};


// ======================================================
// DELETE
// ======================================================

const deleteQr = async (qrTag) => {

    return await qrTag.destroy();
};


module.exports = {

    create,

    findAll,

    findById,

    findByAssetId,

    findByQrCode,

    findByQrValue,

    update,

    deleteQr
};

