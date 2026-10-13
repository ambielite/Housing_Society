const PatrolService =
    require("./patrol.service");


// CREATE
const createPatrol = async (
    req,
    res
) => {

    try {

        const patrol =
            await PatrolService.createPatrol(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Patrol created successfully",
            data: patrol
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// GET ALL
const getAllPatrols = async (
    req,
    res
) => {

    try {

        const filters = {};


        if (req.query.societyId) {

            filters.societyId =
                req.query.societyId;

        }


        if (req.query.staffId) {

            filters.staffId =
                req.query.staffId;

        }


        if (req.query.patrolDate) {

            filters.patrolDate =
                req.query.patrolDate;

        }


        if (req.query.status) {

            filters.status =
                req.query.status;

        }


        const patrols =
            await PatrolService.getAllPatrols(
                filters
            );

        res.status(200).json({
            success: true,
            count: patrols.length,
            data: patrols
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// GET BY ID
const getPatrolById = async (
    req,
    res
) => {

    try {

        const patrol =
            await PatrolService.getPatrolById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: patrol
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }

};


// UPDATE
const updatePatrol = async (
    req,
    res
) => {

    try {

        const patrol =
            await PatrolService.updatePatrol(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Patrol updated successfully",
            data: patrol
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// ADD CHECKPOINT
const addCheckpointToPatrol = async (
    req,
    res
) => {

    try {

        const result =
            await PatrolService
                .addCheckpointToPatrol(
                    req.params.id,
                    req.body
                );

        res.status(201).json({
            success: true,
            message:
                "Checkpoint added to patrol successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// GET CHECKPOINTS
const getPatrolCheckpoints = async (
    req,
    res
) => {

    try {

        const checkpoints =
            await PatrolService
                .getPatrolCheckpoints(
                    req.params.id
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


// START
const startPatrol = async (
    req,
    res
) => {

    try {

        const patrol =
            await PatrolService.startPatrol(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Patrol started successfully",
            data: patrol
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// VERIFY CHECKPOINT
const verifyCheckpoint = async (
    req,
    res
) => {

    try {

        const result =
            await PatrolService.verifyCheckpoint(
                req.params.id,
                req.params.checkpointId,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Checkpoint verified successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// MARK MISSED
const markCheckpointMissed = async (
    req,
    res
) => {

    try {

        const result =
            await PatrolService.markCheckpointMissed(
                req.params.id,
                req.params.checkpointId,
                req.body.remarks
            );

        res.status(200).json({
            success: true,
            message:
                "Checkpoint marked as missed",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// COMPLETE
const completePatrol = async (
    req,
    res
) => {

    try {

        const patrol =
            await PatrolService.completePatrol(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Patrol completed successfully",
            data: patrol
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// CANCEL
const cancelPatrol = async (
    req,
    res
) => {

    try {

        const patrol =
            await PatrolService.cancelPatrol(
                req.params.id,
                req.body.remarks
            );

        res.status(200).json({
            success: true,
            message:
                "Patrol cancelled successfully",
            data: patrol
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// DELETE
const deletePatrol = async (
    req,
    res
) => {

    try {

        const result =
            await PatrolService.deletePatrol(
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

    createPatrol,
    getAllPatrols,
    getPatrolById,
    updatePatrol,
    addCheckpointToPatrol,
    getPatrolCheckpoints,
    startPatrol,
    verifyCheckpoint,
    markCheckpointMissed,
    completePatrol,
    cancelPatrol,
    deletePatrol

};