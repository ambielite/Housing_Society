const service = require("./meeting.service");

const createMeeting = async (req, res) => {
    try {
        const data =
            await service.createMeeting(req.body);

        res.status(201).json({
            success: true,
            message: "Meeting created successfully",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getMeetings = async (req, res) => {
    try {
        const data =
            await service.getMeetings(req.query);

        res.status(200).json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getMeetingById = async (req, res) => {
    try {
        const data =
            await service.getMeetingById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

const updateMeeting = async (req, res) => {
    try {
        const data =
            await service.updateMeeting(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Meeting updated successfully",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const submitForApproval = async (req, res) => {
    try {
        const data =
            await service.submitForApproval(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Meeting submitted for approval",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const approveMeeting = async (req, res) => {
    try {
        const data =
            await service.approveMeeting(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Meeting approved successfully",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const scheduleMeeting = async (req, res) => {
    try {
        const data =
            await service.scheduleMeeting(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Meeting scheduled successfully",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const startMeeting = async (req, res) => {
    try {
        const data =
            await service.startMeeting(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Meeting started successfully",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const completeMeeting = async (req, res) => {
    try {
        const data =
            await service.completeMeeting(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Meeting completed successfully",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const cancelMeeting = async (req, res) => {
    try {
        const data =
            await service.cancelMeeting(
                req.params.id,
                req.body.cancellationReason
            );

        res.status(200).json({
            success: true,
            message: "Meeting cancelled successfully",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const deleteMeeting = async (req, res) => {
    try {
        await service.deleteMeeting(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Meeting deleted successfully"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createMeeting,
    getMeetings,
    getMeetingById,
    updateMeeting,
    submitForApproval,
    approveMeeting,
    scheduleMeeting,
    startMeeting,
    completeMeeting,
    cancelMeeting,
    deleteMeeting
};