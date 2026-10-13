const towerService = require("./tower.service");


// Create Tower
const createTower = async (
    req,
    res,
    next
) => {

    try {

        const tower =
            await towerService.createTower(
                req.body
            );

        res.status(201).json({
            success: true,
            message: "Tower created successfully",
            data: tower
        });

    } catch (error) {

        next(error);

    }
};


// Get All Towers
const getAllTowers = async (
    req,
    res,
    next
) => {

    try {

        const towers =
            await towerService.getAllTowers();

        res.status(200).json({
            success: true,
            count: towers.length,
            data: towers
        });

    } catch (error) {

        next(error);

    }
};


// Get Tower by ID
const getTowerById = async (
    req,
    res,
    next
) => {

    try {

        const tower =
            await towerService.getTowerById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: tower
        });

    } catch (error) {

        next(error);

    }
};


// Get Towers by Society
const getTowersBySociety = async (
    req,
    res,
    next
) => {

    try {

        const towers =
            await towerService.getTowersBySociety(
                req.params.societyId
            );

        res.status(200).json({
            success: true,
            count: towers.length,
            data: towers
        });

    } catch (error) {

        next(error);

    }
};


// Update Tower
const updateTower = async (
    req,
    res,
    next
) => {

    try {

        const tower =
            await towerService.updateTower(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Tower updated successfully",
            data: tower
        });

    } catch (error) {

        next(error);

    }
};


// Deactivate Tower
const deactivateTower = async (
    req,
    res,
    next
) => {

    try {

        const tower =
            await towerService.deactivateTower(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Tower deactivated successfully",
            data: tower
        });

    } catch (error) {

        next(error);

    }
};


module.exports = {
    createTower,
    getAllTowers,
    getTowerById,
    getTowersBySociety,
    updateTower,
    deactivateTower
};