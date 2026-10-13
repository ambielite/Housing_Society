const {
    Op
} = require("sequelize");

const AccountingPeriod =
    require("./accountingPeriod.model");


const create = async (data) => {

    return await AccountingPeriod.create(data);

};


const findAll = async (societyId) => {

    const where = {};

    if (societyId) {
        where.societyId = societyId;
    }

    return await AccountingPeriod.findAll({

        where,

        order: [
            ["startDate", "DESC"]
        ]

    });

};


const findById = async (id) => {

    return await AccountingPeriod.findByPk(id);

};


const findBySociety = async (societyId) => {

    return await AccountingPeriod.findAll({

        where: {
            societyId
        },

        order: [
            ["startDate", "DESC"]
        ]

    });

};


const findOpenPeriod = async (societyId) => {

    return await AccountingPeriod.findOne({

        where: {
            societyId,
            status: "OPEN"
        },

        order: [
            ["startDate", "DESC"]
        ]

    });

};


const findByStatus = async (
    societyId,
    status
) => {

    return await AccountingPeriod.findAll({

        where: {
            societyId,
            status
        },

        order: [
            ["startDate", "DESC"]
        ]

    });

};


const findOverlappingPeriod = async (
    societyId,
    startDate,
    endDate,
    excludeId = null
) => {

    const where = {

        societyId,

        startDate: {
            [Op.lte]: endDate
        },

        endDate: {
            [Op.gte]: startDate
        }

    };

    if (excludeId) {

        where.id = {
            [Op.ne]: excludeId
        };

    }

    return await AccountingPeriod.findOne({
        where
    });

};


const update = async (id, data) => {

    const period =
        await AccountingPeriod.findByPk(id);

    if (!period) {
        return null;
    }

    await period.update(data);

    return period;

};


const deleteById = async (id) => {

    const period =
        await AccountingPeriod.findByPk(id);

    if (!period) {
        return null;
    }

    await period.destroy();

    return period;

};


module.exports = {

    create,
    findAll,
    findById,
    findBySociety,
    findOpenPeriod,
    findByStatus,
    findOverlappingPeriod,
    update,
    deleteById

};