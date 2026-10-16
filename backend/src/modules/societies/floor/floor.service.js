const floorRepository = require("./floor.repository");
const towerRepository = require("../tower/tower.repository");


// Create Floor
const createFloor = async (floorData, societyId) => {

    if (!await towerRepository.findById(floorData.towerId, societyId)) {
        const error = new Error("Tower not found in the selected society");
        error.statusCode = 404;
        throw error;
    }

    const existingFloor =
        await floorRepository.findByTowerAndNumber(
            floorData.towerId,
            floorData.floorNumber
        );


    if (existingFloor) {

        const error = new Error(
            "This floor already exists in the tower"
        );

        error.statusCode = 409;

        throw error;
    }


    return await floorRepository.create({
        ...floorData,
        name: floorData.name
            ? floorData.name.trim()
            : null
    });
};


// Get All Floors
const getAllFloors = async (societyId) => {

    return await floorRepository.findAll(societyId);

};


// Get Floor by ID
const getFloorById = async (id, societyId) => {

    const floor =
        await floorRepository.findById(id, societyId);


    if (!floor) {

        const error = new Error(
            "Floor not found"
        );

        error.statusCode = 404;

        throw error;
    }


    return floor;
};


// Get Floors by Tower
const getFloorsByTower = async (
    towerId,
    societyId
) => {

    return await floorRepository.findByTowerId(
        towerId,
        societyId
    );

};


// Update Floor
const updateFloor = async (
    id,
    floorData,
    societyId
) => {

    const existingFloor =
        await floorRepository.findById(id, societyId);


    if (!existingFloor) {

        const error = new Error(
            "Floor not found"
        );

        error.statusCode = 404;

        throw error;
    }

    if (floorData.towerId && !await towerRepository.findById(floorData.towerId, societyId)) {
        const error = new Error("Tower not found in the selected society");
        error.statusCode = 404;
        throw error;
    }


    if (
        floorData.floorNumber !== undefined
    ) {

        const duplicate =
            await floorRepository.findByTowerAndNumber(
                existingFloor.towerId,
                floorData.floorNumber
            );


        if (
            duplicate &&
            duplicate.id !== id
        ) {

            const error = new Error(
                "Another floor with this number already exists in the tower"
            );

            error.statusCode = 409;

            throw error;
        }
    }


    if (floorData.name) {
        floorData.name =
            floorData.name.trim();
    }


    return await floorRepository.update(
        id,
        floorData,
        societyId
    );
};


// Deactivate Floor
const deactivateFloor = async (id, societyId) => {

    const floor =
        await floorRepository.deactivate(id, societyId);


    if (!floor) {

        const error = new Error(
            "Floor not found"
        );

        error.statusCode = 404;

        throw error;
    }


    return floor;
};


module.exports = {
    createFloor,
    getAllFloors,
    getFloorById,
    getFloorsByTower,
    updateFloor,
    deactivateFloor
};
