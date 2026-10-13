
const service =
    require("./maintenanceSchedule.service");


const createSchedule = async (
    req,
    res
) => {

    try {

        const schedule =
            await service.createSchedule(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Maintenance schedule created successfully",
            data: schedule
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const getAllSchedules = async (
    req,
    res
) => {

    try {

        const schedules =
            await service.getAllSchedules(
                req.query
            );

        res.status(200).json({
            success: true,
            count: schedules.length,
            data: schedules
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const getScheduleById = async (
    req,
    res
) => {

    try {

        const schedule =
            await service.getScheduleById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: schedule
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }
};


const getSchedulesByAssetId = async (
    req,
    res
) => {

    try {

        const schedules =
            await service.getSchedulesByAssetId(
                req.params.assetId
            );

        res.status(200).json({
            success: true,
            count: schedules.length,
            data: schedules
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }
};


const updateSchedule = async (
    req,
    res
) => {

    try {

        const schedule =
            await service.updateSchedule(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Maintenance schedule updated successfully",
            data: schedule
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const pauseSchedule = async (
    req,
    res
) => {

    try {

        const schedule =
            await service.pauseSchedule(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Maintenance schedule paused successfully",
            data: schedule
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const activateSchedule = async (
    req,
    res
) => {

    try {

        const schedule =
            await service.activateSchedule(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Maintenance schedule activated successfully",
            data: schedule
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const completeSchedule = async (
    req,
    res
) => {

    try {

        const schedule =
            await service.completeSchedule(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Maintenance schedule completed successfully",
            data: schedule
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const cancelSchedule = async (
    req,
    res
) => {

    try {

        const schedule =
            await service.cancelSchedule(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Maintenance schedule cancelled successfully",
            data: schedule
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const updateNextDueDate = async (
    req,
    res
) => {

    try {

        const schedule =
            await service.updateNextDueDate(
                req.params.id,
                req.body.nextDueDate
            );

        res.status(200).json({
            success: true,
            message:
                "Next maintenance date updated successfully",
            data: schedule
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const deleteSchedule = async (
    req,
    res
) => {

    try {

        await service.deleteSchedule(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message:
                "Maintenance schedule deleted successfully"
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


module.exports = {
    createSchedule,
    getAllSchedules,
    getScheduleById,
    getSchedulesByAssetId,
    updateSchedule,
    pauseSchedule,
    activateSchedule,
    completeSchedule,
    cancelSchedule,
    updateNextDueDate,
    deleteSchedule
};

