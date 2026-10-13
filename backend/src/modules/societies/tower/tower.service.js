const towerRepository = require("./tower.repository");


// Create Tower
const createTower = async (towerData) => {

    const existingTower =
        await towerRepository.findBySocietyAndName(
            towerData.societyId,
            towerData.name.trim()
        );

    if (existingTower) {

        const error = new Error(
            "Tower with this name already exists in this society"
        );

        error.statusCode = 409;

        throw error;
    }


    if (towerData.floorCount < 1) {

        const error = new Error(
            "Floor count must be at least 1"
        );

        error.statusCode = 400;

        throw error;
    }


    return await towerRepository.create({
        ...towerData,
        name: towerData.name.trim()
    });
};


// Get all Towers
const getAllTowers = async () => {

    return await towerRepository.findAll();

};


// Get Tower by ID
const getTowerById = async (id) => {

    const tower =
        await towerRepository.findById(id);

    if (!tower) {

        const error = new Error(
            "Tower not found"
        );

        error.statusCode = 404;

        throw error;
    }

    return tower;
};


// Get Towers by Society
const getTowersBySociety = async (societyId) => {

    return await towerRepository.findBySocietyId(
        societyId
    );

};


// Update Tower
const updateTower = async (
    id,
    towerData
) => {

    const existingTower =
        await towerRepository.findById(id);

    if (!existingTower) {

        const error = new Error(
            "Tower not found"
        );

        error.statusCode = 404;

        throw error;
    }


    if (towerData.name) {

        const duplicate =
            await towerRepository.findBySocietyAndName(
                existingTower.societyId,
                towerData.name.trim()
            );

        if (
            duplicate &&
            duplicate.id !== id
        ) {

            const error = new Error(
                "Another tower with this name already exists in this society"
            );

            error.statusCode = 409;

            throw error;
        }
    }


    if (
        towerData.floorCount !== undefined &&
        towerData.floorCount < 1
    ) {

        const error = new Error(
            "Floor count must be at least 1"
        );

        error.statusCode = 400;

        throw error;
    }


    return await towerRepository.update(
        id,
        towerData
    );
};


// Deactivate Tower
const deactivateTower = async (id) => {

    const tower =
        await towerRepository.deactivate(id);

    if (!tower) {

        const error = new Error(
            "Tower not found"
        );

        error.statusCode = 404;

        throw error;
    }

    return tower;
};


module.exports = {
    createTower,
    getAllTowers,
    getTowerById,
    getTowersBySociety,
    updateTower,
    deactivateTower
};