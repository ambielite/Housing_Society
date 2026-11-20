const Occupancy = require("./occupancy.model");

const create = async (data, transaction = null) => {
    return await Occupancy.create(data, transaction ? { transaction } : undefined);
};

const findCurrentBySocietyAndUnit = async (societyId, unitId, transaction = null) => {
    return await Occupancy.findAll({
        where: { societyId, unitId, isCurrent: true },
        ...(transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {})
    });
};

const findCurrentTenantByRelationship = async (societyId, unitId, residentId, transaction = null) => {
    return await Occupancy.findAll({
        where: { societyId, unitId, residentId, occupancyType: "TENANT", isCurrent: true },
        ...(transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {})
    });
};

const findCurrentByRelationship = async (societyId, unitId, residentId, transaction = null) => {
    return await Occupancy.findAll({
        where: { societyId, unitId, residentId, isCurrent: true },
        ...(transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {})
    });
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
    endDate,
    transaction = null
) => {
    const occupancy = await Occupancy.findByPk(id, transaction ? { transaction, lock: transaction.LOCK.UPDATE } : undefined);

    if (!occupancy) {
        return null;
    }

    await occupancy.update({
        endDate,
        billingEndDate: endDate,
        isCurrent: false
    }, transaction ? { transaction } : undefined);

    return occupancy;
};

module.exports = {
    create,
    findCurrentBySocietyAndUnit,
    findCurrentTenantByRelationship,
    findCurrentByRelationship,
    findAll,
    findById,
    findCurrentByUnit,
    findByUnit,
    findByResident,
    update,
    closeOccupancy
};
