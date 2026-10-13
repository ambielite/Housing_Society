
const service =
    require("./governanceMeeting.service");


// CREATE
const createGovernanceMeeting = async (req, res) => {

    try {

        const result =
            await service.createGovernanceMeeting(
                req.body
            );

        res.status(201).json({
            success: true,
            message: "Governance meeting created successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


// GET ALL
const getGovernanceMeetings = async (req, res) => {

    try {

        const result =
            await service.getGovernanceMeetings(
                req.query
            );

        res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


// GET BY ID
const getGovernanceMeetingById = async (req, res) => {

    try {

        const result =
            await service.getGovernanceMeetingById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }
};


// UPDATE
const updateGovernanceMeeting = async (req, res) => {

    try {

        const result =
            await service.updateGovernanceMeeting(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Governance meeting updated successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


// PUBLISH NOTICE
const publishNotice = async (req, res) => {

    try {

        const result =
            await service.publishNotice(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Meeting notice published successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


// SCHEDULE
const scheduleMeeting = async (req, res) => {

    try {

        const result =
            await service.scheduleMeeting(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Governance meeting scheduled successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


// START
const startMeeting = async (req, res) => {

    try {

        const result =
            await service.startMeeting(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Governance meeting started successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


// QUORUM
const updateQuorum = async (req, res) => {

    try {

        const result =
            await service.updateQuorum(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Quorum updated successfully",
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
const completeMeeting = async (req, res) => {

    try {

        const result =
            await service.completeMeeting(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Meeting completed successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


// APPROVE MINUTES
const approveMinutes = async (req, res) => {

    try {

        const result =
            await service.approveMinutes(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Meeting minutes approved successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


// CANCEL
const cancelMeeting = async (req, res) => {

    try {

        const result =
            await service.cancelMeeting(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Governance meeting cancelled successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


// DELETE
const deleteGovernanceMeeting = async (req, res) => {

    try {

        await service.deleteGovernanceMeeting(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Governance meeting deleted successfully"
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


module.exports = {
    createGovernanceMeeting,
    getGovernanceMeetings,
    getGovernanceMeetingById,
    updateGovernanceMeeting,
    publishNotice,
    scheduleMeeting,
    startMeeting,
    updateQuorum,
    completeMeeting,
    approveMinutes,
    cancelMeeting,
    deleteGovernanceMeeting
};
