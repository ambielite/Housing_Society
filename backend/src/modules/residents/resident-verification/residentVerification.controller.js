const service = require("./residentVerification.service");

const create = async (req, res) => {
    try {
        const verification =
            await service.createVerification(req.body);

        return res.status(201).json({
            success: true,
            message: "Verification request created successfully",
            data: verification
        });
    } catch (error) {
        console.error("Create verification error:", error);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getById = async (req, res) => {
    try {
        const verification =
            await service.getVerification(req.params.id);

        return res.status(200).json({
            success: true,
            data: verification
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

const getAll = async (req, res) => {
    try {
        const filters = {};

        if (req.query.societyId) {
            filters.societyId = req.query.societyId;
        }

        if (req.query.residentId) {
            filters.residentId = req.query.residentId;
        }

        if (req.query.status) {
            filters.status = req.query.status;
        }

        const verifications = await service.getAll(filters);

        return res.status(200).json({
            success: true,
            count: verifications.length,
            data: verifications
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getPendingQueue = async (req, res) => {
    try {
        const verifications =
            await service.getPendingQueue(
                req.query.societyId
            );

        return res.status(200).json({
            success: true,
            count: verifications.length,
            data: verifications
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getResidentVerifications = async (req, res) => {
    try {
        const verifications =
            await service.getResidentVerifications(
                req.params.residentId
            );

        return res.status(200).json({
            success: true,
            count: verifications.length,
            data: verifications
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

const approve = async (req, res) => {
    try {
        const verification =
            await service.approveVerification(
                req.params.id,
                req.user.id,
                req.body.reviewerRemarks
            );

        return res.status(200).json({
            success: true,
            message:
                "Verification approved and stakeholder activated successfully",
            data: verification
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const reject = async (req, res) => {
    try {
        const verification =
            await service.rejectVerification(
                req.params.id,
                req.user.id,
                req.body.rejectionReason,
                req.body.reviewerRemarks
            );

        return res.status(200).json({
            success: true,
            message: "Verification rejected successfully",
            data: verification
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const requestInformation = async (req, res) => {
    try {
        const verification =
            await service.requestMoreInformation(
                req.params.id,
                req.user.id,
                req.body.informationRequest,
                req.body.reviewerRemarks
            );

        return res.status(200).json({
            success: true,
            message:
                "More information requested successfully",
            data: verification
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const updateStatus = async (req, res) => {
    try {
        const resident =
            await service.updateStakeholderStatus(
                req.params.residentId,
                req.body.status,
                req.body.remarks
            );

        return res.status(200).json({
            success: true,
            message:
                "Stakeholder status updated successfully",
            data: resident
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const remove = async (req, res) => {
    try {
        await service.deleteVerification(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Verification request deleted successfully"
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    create,
    getById,
    getAll,
    getPendingQueue,
    getResidentVerifications,
    approve,
    reject,
    requestInformation,
    updateStatus,
    remove
};
