const Tower = require("./tower.model");


// Create Tower
const create = async (towerData) => {
    return await Tower.create(towerData);
};


// Get all towers
const findAll = async (societyId) => {
    return await Tower.findAll({
        where: { societyId },
        order: [
            ["createdAt", "DESC"]
        ]
    });
};


// Get Tower by ID
const findById = async (id, societyId) => {
    return await Tower.findOne({ where: { id, societyId } });
};


// Get Towers by Society
const findBySocietyId = async (societyId) => {
    return await Tower.findAll({
        where: {
            societyId
        },

        order: [
            ["name", "ASC"]
        ]
    });
};


// Find duplicate tower
const findBySocietyAndName = async (
    societyId,
    name
) => {
    return await Tower.findOne({
        where: {
            societyId,
            name
        }
    });
};


// Update Tower
const update = async (id, towerData, societyId) => {
    const tower = await Tower.findOne({ where: { id, societyId } });

    if (!tower) {
        return null;
    }

    await tower.update(towerData);

    return tower;
};


// Soft delete / deactivate
const deactivate = async (id, societyId) => {
    const tower = await Tower.findOne({ where: { id, societyId } });

    if (!tower) {
        return null;
    }

    await tower.update({
        status: "INACTIVE"
    });

    return tower;
};


module.exports = {
    create,
    findAll,
    findById,
    findBySocietyId,
    findBySocietyAndName,
    update,
    deactivate
};
