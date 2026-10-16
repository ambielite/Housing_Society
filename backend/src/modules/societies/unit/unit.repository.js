const Unit = require("./unit.model");
const Floor = require("../floor/floor.model");
const Tower = require("../tower/tower.model");

const selectedSocietyJoin = (societyId) => [{
    model: Floor,
    as: "floor",
    attributes: [],
    required: true,
    include: [{ model: Tower, as: "tower", attributes: [], where: { societyId }, required: true }],
}];


// Create Unit
const create = async (unitData) => {
    return await Unit.create(unitData);
};


// Get all Units
const findAll = async (societyId) => {
    return await Unit.findAll({
        include: selectedSocietyJoin(societyId),
        order: [
            ["unitNumber", "ASC"]
        ]
    });
};


// Get Unit by ID
const findById = async (id, societyId) => {
    return await Unit.findOne({ where: { id }, include: selectedSocietyJoin(societyId) });
};


// Get Units by Floor
const findByFloorId = async (floorId, societyId) => {
    return await Unit.findAll({
        where: {
            floorId
        },
        include: selectedSocietyJoin(societyId),

        order: [
            ["unitNumber", "ASC"]
        ]
    });
};


// Find duplicate Unit
const findByFloorAndUnitNumber = async (
    floorId,
    unitNumber
) => {
    return await Unit.findOne({
        where: {
            floorId,
            unitNumber
        }
    });
};


// Update Unit
const update = async (
    id,
    unitData,
    societyId
) => {

    const unit = await Unit.findOne({ where: { id }, include: selectedSocietyJoin(societyId) });

    if (!unit) {
        return null;
    }

    await unit.update(unitData);

    return unit;
};


// Deactivate Unit
const deactivate = async (id, societyId) => {

    const unit = await Unit.findOne({ where: { id }, include: selectedSocietyJoin(societyId) });

    if (!unit) {
        return null;
    }

    await unit.update({
        status: "INACTIVE"
    });

    return unit;
};


module.exports = {
    create,
    findAll,
    findById,
    findByFloorId,
    findByFloorAndUnitNumber,
    update,
    deactivate
};
