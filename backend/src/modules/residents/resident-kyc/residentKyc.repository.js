const { Op } = require("sequelize");
const ResidentKyc = require("./residentKyc.model");

const create = async (data) => {
    return await ResidentKyc.create(data);
};


const findById = async (id) => {
    return await ResidentKyc.findByPk(id);
};


const findAll = async (where = {}) => {
    return await ResidentKyc.findAll({
        where,
        order: [["created_at", "DESC"]]
    });
};


const findByStakeholder = async (stakeholderId) => {
    return await ResidentKyc.findAll({
        where: {
            stakeholderId,
            isActive: true
        },
        order: [["created_at", "DESC"]]
    });
};


const findBySociety = async (societyId) => {
    return await ResidentKyc.findAll({
        where: {
            societyId,
            isActive: true
        },
        order: [["created_at", "DESC"]]
    });
};


const findPending = async (societyId) => {
    return await ResidentKyc.findAll({
        where: {
            societyId,
            verificationStatus: "PENDING",
            isActive: true
        },
        order: [["created_at", "ASC"]]
    });
};


const findExpiring = async (societyId, startDate, endDate) => {
    return await ResidentKyc.findAll({
        where: {
            societyId,
            isActive: true,
            expiryDate: {
                [Op.between]: [startDate, endDate]
            }
        },
        order: [["expiryDate", "ASC"]]
    });
};


const update = async (document, data) => {
    return await document.update(data);
};


module.exports = {
    create,
    findById,
    findAll,
    findByStakeholder,
    findBySociety,
    findPending,
    findExpiring,
    update
};