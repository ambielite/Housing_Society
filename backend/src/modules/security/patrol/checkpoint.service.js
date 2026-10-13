const Society =
    require("../../societies/society/society.model");

const CheckpointRepository =
    require("./checkpoint.repository");

const {
    validateCreate,
    validateUpdate
} = require("./checkpoint.validation");


// CREATE
const createCheckpoint = async (data) => {

    validateCreate(data);


    const society =
        await Society.findByPk(
            data.societyId
        );

    if (!society) {

        throw new Error(
            "Society not found"
        );

    }


    const existing =
        await CheckpointRepository.findByCode(
            data.societyId,
            data.checkpointCode
        );

    if (existing) {

        throw new Error(
            "Checkpoint code already exists in this society"
        );

    }


    return await CheckpointRepository.create(
        data
    );
};


// GET BY ID
const getCheckpointById = async (id) => {

    const checkpoint =
        await CheckpointRepository.findById(
            id
        );

    if (!checkpoint) {

        throw new Error(
            "Checkpoint not found"
        );

    }

    return checkpoint;
};


// GET ALL
const getAllCheckpoints = async (
    filters = {}
) => {

    return await CheckpointRepository.findAll(
        filters
    );

};


// UPDATE
const updateCheckpoint = async (
    id,
    data
) => {

    validateUpdate(data);


    const checkpoint =
        await CheckpointRepository.findById(
            id
        );

    if (!checkpoint) {

        throw new Error(
            "Checkpoint not found"
        );

    }


    if (data.checkpointCode) {

        const existing =
            await CheckpointRepository.findByCode(
                checkpoint.societyId,
                data.checkpointCode
            );

        if (
            existing &&
            existing.id !== checkpoint.id
        ) {

            throw new Error(
                "Checkpoint code already exists"
            );

        }

    }


    return await CheckpointRepository.update(
        checkpoint,
        data
    );
};


// ACTIVATE
const activateCheckpoint = async (id) => {

    const checkpoint =
        await CheckpointRepository.findById(
            id
        );

    if (!checkpoint) {

        throw new Error(
            "Checkpoint not found"
        );

    }


    return await CheckpointRepository.update(
        checkpoint,
        {
            status: "ACTIVE"
        }
    );
};


// DEACTIVATE
const deactivateCheckpoint = async (id) => {

    const checkpoint =
        await CheckpointRepository.findById(
            id
        );

    if (!checkpoint) {

        throw new Error(
            "Checkpoint not found"
        );

    }


    return await CheckpointRepository.update(
        checkpoint,
        {
            status: "INACTIVE"
        }
    );
};


// DELETE
const deleteCheckpoint = async (id) => {

    const checkpoint =
        await CheckpointRepository.findById(
            id
        );

    if (!checkpoint) {

        throw new Error(
            "Checkpoint not found"
        );

    }


    await CheckpointRepository.remove(
        checkpoint
    );


    return {
        message:
            "Checkpoint deleted successfully"
    };
};


module.exports = {
    createCheckpoint,
    getCheckpointById,
    getAllCheckpoints,
    updateCheckpoint,
    activateCheckpoint,
    deactivateCheckpoint,
    deleteCheckpoint
};