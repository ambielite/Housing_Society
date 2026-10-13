const service = require("./lifecycleApproval.service");

const createApproval = async (req, res) => {

    try {

        const approval = await service.createApproval(req.body);

        return res.status(201).json({
            success: true,
            message: "Lifecycle approval created successfully",
            data: approval
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getApprovals = async (req, res) => {

    try {

        const approvals = await service.getApprovals();

        return res.status(200).json({
            success: true,
            data: approvals
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getPendingApprovals = async (req, res) => {

    try {

        const approvals =
            await service.getPendingApprovals();

        return res.status(200).json({
            success: true,
            data: approvals
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getApproval = async (req, res) => {

    try {

        const approval =
            await service.getApproval(req.params.id);

        return res.status(200).json({
            success: true,
            data: approval
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const getApprovalsByLifecycle = async (req, res) => {

    try {

        const approvals =
            await service.getApprovalsByLifecycle(
                req.params.lifecycleType,
                req.params.lifecycleId
            );

        return res.status(200).json({
            success: true,
            data: approvals
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const approveApproval = async (req, res) => {

    try {

        const approval =
            await service.approveApproval(
                req.params.id,
                req.body.actionBy,
                req.body.remarks
            );

        return res.status(200).json({
            success: true,
            message: "Lifecycle approval approved successfully",
            data: approval
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const rejectApproval = async (req, res) => {

    try {

        const approval =
            await service.rejectApproval(
                req.params.id,
                req.body.actionBy,
                req.body.remarks
            );

        return res.status(200).json({
            success: true,
            message: "Lifecycle approval rejected successfully",
            data: approval
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteApproval = async (req, res) => {

    try {

        await service.deleteApproval(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Lifecycle approval deleted successfully"
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createApproval,
    getApprovals,
    getPendingApprovals,
    getApproval,
    getApprovalsByLifecycle,
    approveApproval,
    rejectApproval,
    deleteApproval
};