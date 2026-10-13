const Occupancy = require("./occupancy.model");

const create = async (data) => {
    return await Occupancy.create(data);
};

const findAll = async () => {
    return await Occupancy.findAll({
        order: [["startDate", "DESC"]]
    });
};

const findById = async (id) => {
    return await Occupancy.findByPk(id);
};

const findCurrentByUnit = async (unitId) => {
    return await Occupancy.findOne({
        where: {
            unitId,
            isCurrent: true
        }
    });
};

const findByUnit = async (unitId) => {
    return await Occupancy.findAll({
        where: {
            unitId
        },
        order: [["startDate", "DESC"]]
    });
};

const findByResident = async (residentId) => {
    return await Occupancy.findAll({
        where: {
            residentId
        },
        order: [["startDate", "DESC"]]
    });
};

const update = async (id, data) => {
    const occupancy = await Occupancy.findByPk(id);

    if (!occupancy) {
        return null;
    }

    await occupancy.update(data);

    return occupancy;
};

const closeOccupancy = async (
    id,
    endDate
) => {
    const occupancy = await Occupancy.findByPk(id);

    if (!occupancy) {
        return null;
    }

    await occupancy.update({
        endDate,
        billingEndDate: endDate,
        isCurrent: false
    });

    return occupancy;
};

module.exports = {
    create,
    findAll,
    findById,
    findCurrentByUnit,
    findByUnit,
    findByResident,
    update,
    closeOccupancy
};