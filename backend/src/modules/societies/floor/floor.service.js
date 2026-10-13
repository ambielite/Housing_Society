const floorRepository = require("./floor.repository");


// Create Floor
const createFloor = async (floorData) => {

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
const getAllFloors = async () => {

    return await floorRepository.findAll();

};


// Get Floor by ID
const getFloorById = async (id) => {

    const floor =
        await floorRepository.findById(id);


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
    towerId
) => {

    return await floorRepository.findByTowerId(
        towerId
    );

};


// Update Floor
const updateFloor = async (
    id,
    floorData
) => {

    const existingFloor =
        await floorRepository.findById(id);


    if (!existingFloor) {

        const error = new Error(
            "Floor not found"
        );

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
        floorData
    );
};


// Deactivate Floor
const deactivateFloor = async (id) => {

    const floor =
        await floorRepository.deactivate(id);


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