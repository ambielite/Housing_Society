const Tower = require("./tower.model");


// Create Tower
const create = async (towerData) => {
    return await Tower.create(towerData);
};


// Get all towers
const findAll = async () => {
    return await Tower.findAll({
        order: [
            ["createdAt", "DESC"]
        ]
    });
};


// Get Tower by ID
const findById = async (id) => {
    return await Tower.findByPk(id);
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
const update = async (id, towerData) => {
    const tower = await Tower.findByPk(id);

    if (!tower) {
        return null;
    }

    await tower.update(towerData);

    return tower;
};


// Soft delete / deactivate
const deactivate = async (id) => {
    const tower = await Tower.findByPk(id);

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