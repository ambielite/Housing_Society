const unitRepository = require("./unit.repository");
const floorRepository = require("../floor/floor.repository");


// Create Unit
const createUnit = async (unitData, societyId) => {

    if (!await floorRepository.findById(unitData.floorId, societyId)) {
        const error = new Error("Floor not found in the selected society");
        error.statusCode = 404;
        throw error;
    }

    const unitNumber =
        unitData.unitNumber.trim();


    // Duplicate Unit Check
    const existingUnit =
        await unitRepository.findByFloorAndUnitNumber(
            unitData.floorId,
            unitNumber
        );


    if (existingUnit) {

        const error = new Error(
            "Unit number already exists on this floor"
        );

        error.statusCode = 409;

        throw error;
    }


    // If area is supplied, effective date is recommended.
    if (
        (
            unitData.carpetArea !== undefined ||
            unitData.builtUpArea !== undefined
        ) &&
        !unitData.areaEffectiveFrom
    ) {

        const error = new Error(
            "areaEffectiveFrom is required when area information is supplied"
        );

        error.statusCode = 400;

        throw error;
    }


    return await unitRepository.create({
        ...unitData,

        unitNumber,

        propertyType:
            unitData.propertyType ||
            "RESIDENTIAL",

        status:
            unitData.status ||
            "VACANT"
    });
};


// Get All Units
const getAllUnits = async (societyId) => {

    return await unitRepository.findAll(societyId);

};


// Get Unit by ID
const getUnitById = async (id, societyId) => {

    const unit =
        await unitRepository.findById(id, societyId);


    if (!unit) {

        const error = new Error(
            "Unit not found"
        );

        error.statusCode = 404;

        throw error;
    }


    return unit;
};


// Get Units by Floor
const getUnitsByFloor = async (
    floorId,
    societyId
) => {

    return await unitRepository.findByFloorId(
        floorId,
        societyId
    );

};


// Update Unit
const updateUnit = async (
    id,
    unitData,
    societyId
) => {

    const existingUnit =
        await unitRepository.findById(id, societyId);


    if (!existingUnit) {

        const error = new Error(
            "Unit not found"
        );

        error.statusCode = 404;

        throw error;
    }

    if (unitData.floorId && !await floorRepository.findById(unitData.floorId, societyId)) {
        const error = new Error("Floor not found in the selected society");
        error.statusCode = 404;
        throw error;
    }


    // Duplicate Unit Number
    if (unitData.unitNumber) {

        const newUnitNumber =
            unitData.unitNumber.trim();


        const duplicate =
            await unitRepository.findByFloorAndUnitNumber(
                existingUnit.floorId,
                newUnitNumber
            );


        if (
            duplicate &&
            duplicate.id !== id
        ) {

            const error = new Error(
                "Another unit with this number already exists on this floor"
            );

            error.statusCode = 409;

            throw error;
        }


        unitData.unitNumber =
            newUnitNumber;
    }


    // Detect area changes
    const carpetAreaChanged =
        unitData.carpetArea !== undefined &&
        Number(unitData.carpetArea) !==
        Number(existingUnit.carpetArea);


    const builtUpAreaChanged =
        unitData.builtUpArea !== undefined &&
        Number(unitData.builtUpArea) !==
        Number(existingUnit.builtUpArea);


    const areaChanged =
        carpetAreaChanged ||
        builtUpAreaChanged;


    // Effective date required for billing-impacting area changes
    if (
        areaChanged &&
        !unitData.areaEffectiveFrom
    ) {

        const error = new Error(
            "areaEffectiveFrom is required when changing carpet area or built-up area"
        );

        error.statusCode = 400;

        throw error;
    }


    return await unitRepository.update(
        id,
        unitData,
        societyId
    );
};


// Deactivate Unit
const deactivateUnit = async (id, societyId) => {

    const unit =
        await unitRepository.deactivate(id, societyId);


    if (!unit) {

        const error = new Error(
            "Unit not found"
        );

        error.statusCode = 404;

        throw error;
    }


    return unit;
};


module.exports = {
    createUnit,
    getAllUnits,
    getUnitById,
    getUnitsByFloor,
    updateUnit,
    deactivateUnit
};
