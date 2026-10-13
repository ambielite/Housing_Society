const Floor = require("./floor.model");


// Create Floor
const create = async (floorData) => {
    return await Floor.create(floorData);
};


// Get all Floors
const findAll = async () => {
    return await Floor.findAll({
        order: [
            ["floorNumber", "ASC"]
        ]
    });
};


// Get Floor by ID
const findById = async (id) => {
    return await Floor.findByPk(id);
};


// Get Floors by Tower
const findByTowerId = async (towerId) => {
    return await Floor.findAll({
        where: {
            towerId
        },

        order: [
            ["floorNumber", "ASC"]
        ]
    });
};


// Find duplicate Floor
const findByTowerAndNumber = async (
    towerId,
    floorNumber
) => {
    return await Floor.findOne({
        where: {
            towerId,
            floorNumber
        }
    });
};


// Update Floor
const update = async (
    id,
    floorData
) => {
    const floor = await Floor.findByPk(id);

    if (!floor) {
        return null;
    }

    await floor.update(floorData);

    return floor;
};


// Deactivate Floor
const deactivate = async (id) => {
    const floor = await Floor.findByPk(id);

    if (!floor) {
        return null;
    }

    await floor.update({
        status: "INACTIVE"
    });

    return floor;
};


module.exports = {
    create,
    findAll,
    findById,
    findByTowerId,
    findByTowerAndNumber,
    update,
    deactivate
};