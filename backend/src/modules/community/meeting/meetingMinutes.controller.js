const service =
    require("./meetingMinutes.service");

const createMinutes = async (req, res) => {
    try {
        const data =
            await service.createMinutes(
                req.body
            );

        res.status(201).json({
            success: true,
            message: "Meeting minutes created successfully",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getMinutes = async (req, res) => {
    try {
        const data =
            await service.getMinutes(
                req.params.meetingId
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

const updateMinutes = async (req, res) => {
    try {
        const data =
            await service.updateMinutes(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Minutes updated successfully",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const submitMinutes = async (req, res) => {
    try {
        const data =
            await service.submitMinutes(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Minutes submitted successfully",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const approveMinutes = async (req, res) => {
    try {
        const data =
            await service.approveMinutes(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Minutes approved successfully",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const rejectMinutes = async (req, res) => {
    try {
        const data =
            await service.rejectMinutes(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Minutes rejected",
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const deleteMinutes = async (req, res) => {
    try {
        await service.deleteMinutes(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Minutes deleted successfully"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createMinutes,
    getMinutes,
    updateMinutes,
    submitMinutes,
    approveMinutes,
    rejectMinutes,
    deleteMinutes
};