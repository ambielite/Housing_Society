
const AssetDocument =
    require("./assetDocument.model");


// ======================================================
// CREATE
// ======================================================

const create = async (data) => {

    return await AssetDocument.create(data);
};


// ======================================================
// GET ALL
// ======================================================

const findAll = async (where = {}) => {

    return await AssetDocument.findAll({

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

    return await AssetDocument.findByPk(id);
};


// ======================================================
// GET BY ASSET
// ======================================================

const findByAssetId = async (assetId) => {

    return await AssetDocument.findAll({

        where: {
            assetId
        },

        order: [
            ["created_at", "DESC"]
        ]
    });
};


// ======================================================
// GET WARRANTY DOCUMENTS
// ======================================================

const findWarrantyDocuments = async (
    assetId
) => {

    return await AssetDocument.findAll({

        where: {
            assetId,

            documentType:
                "WARRANTY_CERTIFICATE"
        },

        order: [
            ["warrantyEndDate", "ASC"]
        ]
    });
};


// ======================================================
// UPDATE
// ======================================================

const update = async (
    document,
    data
) => {

    return await document.update(data);
};


// ======================================================
// DELETE
// ======================================================

const deleteDocument = async (
    document
) => {

    return await document.destroy();
};


module.exports = {

    create,

    findAll,

    findById,

    findByAssetId,

    findWarrantyDocuments,

    update,

    deleteDocument
};

