const Unit = require("./unit.model");


// Create Unit
const create = async (unitData) => {
    return await Unit.create(unitData);
};


// Get all Units
const findAll = async () => {
    return await Unit.findAll({
        order: [
            ["unitNumber", "ASC"]
        ]
    });
};


// Get Unit by ID
const findById = async (id) => {
    return await Unit.findByPk(id);
};


// Get Units by Floor
const findByFloorId = async (floorId) => {
    return await Unit.findAll({
        where: {
            floorId
        },

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
    unitData
) => {

    const unit = await Unit.findByPk(id);

    if (!unit) {
        return null;
    }

    await unit.update(unitData);

    return unit;
};


// Deactivate Unit
const deactivate = async (id) => {

    const unit = await Unit.findByPk(id);

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