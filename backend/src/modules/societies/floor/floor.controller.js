const floorService = require("./floor.service");


// Create Floor
const createFloor = async (
    req,
    res,
    next
) => {

    try {

        const floor =
            await floorService.createFloor(
                req.body,
                req.user.societyId
            );


        res.status(201).json({
            success: true,
            message: "Floor created successfully",
            data: floor
        });

    } catch (error) {

        next(error);

    }
};


// Get All Floors
const getAllFloors = async (
    req,
    res,
    next
) => {

    try {

        const floors =
            await floorService.getAllFloors(req.user.societyId);


        res.status(200).json({
            success: true,
            count: floors.length,
            data: floors
        });

    } catch (error) {

        next(error);

    }
};


// Get Floor by ID
const getFloorById = async (
    req,
    res,
    next
) => {

    try {

        const floor =
            await floorService.getFloorById(
                req.params.id,
                req.user.societyId
            );


        res.status(200).json({
            success: true,
            data: floor
        });

    } catch (error) {

        next(error);

    }
};


// Get Floors by Tower
const getFloorsByTower = async (
    req,
    res,
    next
) => {

    try {

        const floors =
            await floorService.getFloorsByTower(
                req.params.towerId,
                req.user.societyId
            );


        res.status(200).json({
            success: true,
            count: floors.length,
            data: floors
        });

    } catch (error) {

        next(error);

    }
};


// Update Floor
const updateFloor = async (
    req,
    res,
    next
) => {

    try {

        const floor =
            await floorService.updateFloor(
                req.params.id,
                req.body,
                req.user.societyId
            );


        res.status(200).json({
            success: true,
            message: "Floor updated successfully",
            data: floor
        });

    } catch (error) {

        next(error);

    }
};


// Deactivate Floor
const deactivateFloor = async (
    req,
    res,
    next
) => {

    try {

        const floor =
            await floorService.deactivateFloor(
                req.params.id,
                req.user.societyId
            );


        res.status(200).json({
            success: true,
            message: "Floor deactivated successfully",
            data: floor
        });

    } catch (error) {

        next(error);

    }
};


module.exports = {
    createFloor,
    getAllFloors,
    getFloorById,
    getFloorsByTower,
    updateFloor,
    deactivateFloor
};
