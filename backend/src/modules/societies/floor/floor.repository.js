const Floor = require("./floor.model");
const Tower = require("../tower/tower.model");


// Create Floor
const create = async (floorData) => {
    return await Floor.create(floorData);
};


// Get all Floors
const findAll = async (societyId) => {
    return await Floor.findAll({
        include: [{ model: Tower, as: "tower", attributes: [], where: { societyId }, required: true }],
        order: [
            ["floorNumber", "ASC"]
        ]
    });
};


// Get Floor by ID
const findById = async (id, societyId) => {
    return await Floor.findOne({
        where: { id },
        include: [{ model: Tower, as: "tower", attributes: [], where: { societyId }, required: true }],
    });
};


// Get Floors by Tower
const findByTowerId = async (towerId, societyId) => {
    return await Floor.findAll({
        where: {
            towerId
        },
        include: [{ model: Tower, as: "tower", attributes: [], where: { societyId }, required: true }],

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
    floorData,
    societyId
) => {
    const floor = await Floor.findOne({
        where: { id },
        include: [{ model: Tower, as: "tower", attributes: [], where: { societyId }, required: true }],
    });

    if (!floor) {
        return null;
    }

    await floor.update(floorData);

    return floor;
};


// Deactivate Floor
const deactivate = async (id, societyId) => {
    const floor = await Floor.findOne({
        where: { id },
        include: [{ model: Tower, as: "tower", attributes: [], where: { societyId }, required: true }],
    });

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
