const { Op } = require("sequelize");

const KycDocument = require("./kycDocument.model");


// CREATE
const create = async (data) => {

    return await KycDocument.create(data);
};


// FIND BY ID
const findById = async (id) => {

    return await KycDocument.findByPk(id);
};


// FIND ALL
const findAll = async (where = {}) => {

    return await KycDocument.findAll({
        where,
        order: [
            ["created_at", "DESC"]
        ]
    });
};


// FIND BY STAKEHOLDER
const findByStakeholder = async (
    societyId,
    stakeholderId
) => {

    return await KycDocument.findAll({

        where: {
            societyId,
            stakeholderId,
            isArchived: false
        },

        order: [
            ["created_at", "DESC"]
        ]
    });
};


// FIND PENDING
const findPending = async (societyId) => {

    const where = {
        verificationStatus: "PENDING",
        isArchived: false
    };

    if (societyId) {
        where.societyId = societyId;
    }

    return await KycDocument.findAll({

        where,

        order: [
            ["created_at", "ASC"]
        ]
    });
};


// FIND EXPIRING DOCUMENTS
const findExpiring = async (
    societyId,
    startDate,
    endDate
) => {

    const where = {

        expiryDate: {
            [Op.between]: [
                startDate,
                endDate
            ]
        },

        isArchived: false
    };

    if (societyId) {
        where.societyId = societyId;
    }

    return await KycDocument.findAll({
        where,
        order: [
            ["expiry_date", "ASC"]
        ]
    });
};


// UPDATE
const update = async (
    document,
    data
) => {

    await document.update(data);

    return document;
};


// ARCHIVE
const archive = async (
    document,
    archivedBy
) => {

    await document.update({

        isArchived: true,

        archivedAt: new Date(),

        archivedBy

    });

    return document;
};


module.exports = {
    create,
    findById,
    findAll,
    findByStakeholder,
    findPending,
    findExpiring,
    update,
    archive
};