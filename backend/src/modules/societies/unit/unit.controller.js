const unitService = require("./unit.service");


// Create Unit
const createUnit = async (
    req,
    res,
    next
) => {

    try {

        const unit =
            await unitService.createUnit(
                req.body,
                req.user.societyId
            );


        res.status(201).json({
            success: true,
            message: "Unit created successfully",
            data: unit
        });

    } catch (error) {

        next(error);

    }
};


// Get All Units
const getAllUnits = async (
    req,
    res,
    next
) => {

    try {

        const units =
            await unitService.getAllUnits(req.user.societyId);


        res.status(200).json({
            success: true,
            count: units.length,
            data: units
        });

    } catch (error) {

        next(error);

    }
};


// Get Unit by ID
const getUnitById = async (
    req,
    res,
    next
) => {

    try {

        const unit =
            await unitService.getUnitById(
                req.params.id,
                req.user.societyId
            );


        res.status(200).json({
            success: true,
            data: unit
        });

    } catch (error) {

        next(error);

    }
};


// Get Units by Floor
const getUnitsByFloor = async (
    req,
    res,
    next
) => {

    try {

        const units =
            await unitService.getUnitsByFloor(
                req.params.floorId,
                req.user.societyId
            );


        res.status(200).json({
            success: true,
            count: units.length,
            data: units
        });

    } catch (error) {

        next(error);

    }
};


// Update Unit
const updateUnit = async (
    req,
    res,
    next
) => {

    try {

        const unit =
            await unitService.updateUnit(
                req.params.id,
                req.body,
                req.user.societyId
            );


        res.status(200).json({
            success: true,
            message: "Unit updated successfully",
            data: unit
        });

    } catch (error) {

        next(error);

    }
};


// Deactivate Unit
const deactivateUnit = async (
    req,
    res,
    next
) => {

    try {

        const unit =
            await unitService.deactivateUnit(
                req.params.id,
                req.user.societyId
            );


        res.status(200).json({
            success: true,
            message: "Unit deactivated successfully",
            data: unit
        });

    } catch (error) {

        next(error);

    }
};


module.exports = {
    createUnit,
    getAllUnits,
    getUnitById,
    getUnitsByFloor,
    updateUnit,
    deactivateUnit
};
