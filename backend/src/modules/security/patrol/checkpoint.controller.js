const CheckpointService =
    require("./checkpoint.service");


// CREATE
const createCheckpoint = async (
    req,
    res
) => {

    try {

        const checkpoint =
            await CheckpointService.createCheckpoint(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Checkpoint created successfully",
            data: checkpoint
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// GET ALL
const getAllCheckpoints = async (
    req,
    res
) => {

    try {

        const filters = {};


        if (req.query.societyId) {

            filters.societyId =
                req.query.societyId;

        }


        if (req.query.status) {

            filters.status =
                req.query.status;

        }


        if (req.query.verificationMethod) {

            filters.verificationMethod =
                req.query.verificationMethod;

        }


        const checkpoints =
            await CheckpointService.getAllCheckpoints(
                filters
            );

        res.status(200).json({
            success: true,
            count: checkpoints.length,
            data: checkpoints
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// GET BY ID
const getCheckpointById = async (
    req,
    res
) => {

    try {

        const checkpoint =
            await CheckpointService.getCheckpointById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: checkpoint
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }

};


// UPDATE
const updateCheckpoint = async (
    req,
    res
) => {

    try {

        const checkpoint =
            await CheckpointService.updateCheckpoint(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Checkpoint updated successfully",
            data: checkpoint
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// ACTIVATE
const activateCheckpoint = async (
    req,
    res
) => {

    try {

        const checkpoint =
            await CheckpointService.activateCheckpoint(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Checkpoint activated successfully",
            data: checkpoint
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// DEACTIVATE
const deactivateCheckpoint = async (
    req,
    res
) => {

    try {

        const checkpoint =
            await CheckpointService.deactivateCheckpoint(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Checkpoint deactivated successfully",
            data: checkpoint
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// DELETE
const deleteCheckpoint = async (
    req,
    res
) => {

    try {

        const result =
            await CheckpointService.deleteCheckpoint(
                req.params.id
            );

        res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


module.exports = {
    createCheckpoint,
    getAllCheckpoints,
    getCheckpointById,
    updateCheckpoint,
    activateCheckpoint,
    deactivateCheckpoint,
    deleteCheckpoint
};