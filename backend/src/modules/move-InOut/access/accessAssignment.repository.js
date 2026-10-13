const AccessAssignment = require("./accessAssignment.model");

const create = async (data) => {
    return await AccessAssignment.create(data);
};


const findAll = async () => {
    return await AccessAssignment.findAll({
        order: [["created_at", "DESC"]]
    });
};


const findById = async (id) => {
    return await AccessAssignment.findByPk(id);
};


const findActiveByUnit = async (unitId) => {
    return await AccessAssignment.findOne({
        where: {
            unitId,
            accessStatus: "ACTIVE"
        },
        order: [["created_at", "DESC"]]
    });
};


const findActiveByResident = async (residentId) => {
    return await AccessAssignment.findAll({
        where: {
            residentId,
            accessStatus: "ACTIVE"
        },
        order: [["created_at", "DESC"]]
    });
};


const findByUnit = async (unitId) => {
    return await AccessAssignment.findAll({
        where: {
            unitId
        },
        order: [["created_at", "DESC"]]
    });
};


const findByLifecycle = async (
    lifecycleType,
    lifecycleId
) => {
    return await AccessAssignment.findAll({
        where: {
            lifecycleType,
            lifecycleId
        },
        order: [["created_at", "DESC"]]
    });
};


const findActive = async () => {
    return await AccessAssignment.findAll({
        where: {
            accessStatus: "ACTIVE"
        },
        order: [["created_at", "DESC"]]
    });
};


const update = async (id, data) => {
    const assignment =
        await AccessAssignment.findByPk(id);

    if (!assignment) {
        return null;
    }

    await assignment.update(data);

    return assignment;
};


const deleteById = async (id) => {
    const assignment =
        await AccessAssignment.findByPk(id);

    if (!assignment) {
        return null;
    }

    await assignment.destroy();

    return assignment;
};


module.exports = {
    create,
    findAll,
    findById,
    findActiveByUnit,
    findActiveByResident,
    findByUnit,
    //findByResident,
    findByLifecycle,
    findActive,
    update,
    deleteById
};