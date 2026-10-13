const service = require("./moveOut.service");

const createMoveOut = async (req, res) => {
    try {
        const moveOut = await service.createMoveOut(
            req.body
        );

        return res.status(201).json({
            success: true,
            message: "Move-out request created successfully",
            data: moveOut
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getMoveOuts = async (req, res) => {
    try {
        const moveOuts = await service.getMoveOuts();

        return res.status(200).json({
            success: true,
            data: moveOuts
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getMoveOut = async (req, res) => {
    try {
        const moveOut = await service.getMoveOut(
            req.params.id
        );

        if (!moveOut) {
            return res.status(404).json({
                success: false,
                message: "Move-out request not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: moveOut
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const updateMoveOut = async (req, res) => {
    try {
        const moveOut = await service.updateMoveOut(
            req.params.id,
            req.body
        );

        if (!moveOut) {
            return res.status(404).json({
                success: false,
                message: "Move-out request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Move-out request updated successfully",
            data: moveOut
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const startChecklist = async (req, res) => {
    try {
        const moveOut =
            await service.startChecklist(
                req.params.id
            );

        if (!moveOut) {
            return res.status(404).json({
                success: false,
                message: "Move-out request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Move-out checklist started",
            data: moveOut
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const completeChecklist = async (req, res) => {
    try {
        const moveOut =
            await service.completeChecklist(
                req.params.id
            );

        if (!moveOut) {
            return res.status(404).json({
                success: false,
                message: "Move-out request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Move-out checklist completed",
            data: moveOut
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const updateOutstandingDues = async (
    req,
    res
) => {
    try {
        const moveOut =
            await service.updateOutstandingDues(
                req.params.id,
                req.body.outstandingAmount,
                req.body.chargesPaid
            );

        if (!moveOut) {
            return res.status(404).json({
                success: false,
                message: "Move-out request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Outstanding dues updated successfully",
            data: moveOut
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const submitFinancialClearance = async (
    req,
    res
) => {
    try {
        const moveOut =
            await service.submitFinancialClearance(
                req.params.id
            );

        if (!moveOut) {
            return res.status(404).json({
                success: false,
                message: "Move-out request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Financial clearance completed",
            data: moveOut
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const approveMoveOut = async (
    req,
    res
) => {
    try {
        const moveOut =
            await service.approveMoveOut(
                req.params.id,
                req.body.approvedBy
            );

        if (!moveOut) {
            return res.status(404).json({
                success: false,
                message: "Move-out request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Move-out approved successfully",
            data: moveOut
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const rejectMoveOut = async (
    req,
    res
) => {
    try {
        const moveOut =
            await service.rejectMoveOut(
                req.params.id,
                req.body.remarks
            );

        if (!moveOut) {
            return res.status(404).json({
                success: false,
                message: "Move-out request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Move-out rejected",
            data: moveOut
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const issueMoveOutPass = async (
    req,
    res
) => {
    try {
        const moveOut =
            await service.issueMoveOutPass(
                req.params.id
            );

        if (!moveOut) {
            return res.status(404).json({
                success: false,
                message: "Move-out request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Move-out pass issued",
            data: moveOut
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const revokeAccess = async (
    req,
    res
) => {
    try {
        const moveOut =
            await service.revokeAccess(
                req.params.id
            );

        if (!moveOut) {
            return res.status(404).json({
                success: false,
                message: "Move-out request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Resident access revoked",
            data: moveOut
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const completeMoveOut = async (
    req,
    res
) => {
    try {
        const moveOut =
            await service.completeMoveOut(
                req.params.id
            );

        if (!moveOut) {
            return res.status(404).json({
                success: false,
                message: "Move-out request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Move-out lifecycle completed successfully",
            data: moveOut
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const deleteMoveOut = async (req, res) => {
    try {
        const moveOut = await service.deleteMoveOut(req.params.id);

        if (!moveOut) {
            return res.status(404).json({
                success: false,
                message: "Move-out request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Move-out request deleted successfully",
            data: moveOut
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const cancelMoveOut = async (req, res) => {
    try {
        const moveOut = await service.cancelMoveOut(req.params.id, req.body?.reason);
        if (!moveOut) return res.status(404).json({ success: false, message: "Move-out request not found" });
        return res.status(200).json({ success: true, message: "Move-out cancelled; transition history retained", data: moveOut });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
    createMoveOut,
    getMoveOuts,
    getMoveOut,
    updateMoveOut,
    deleteMoveOut,
    startChecklist,
    completeChecklist,
    updateOutstandingDues,
    submitFinancialClearance,
    approveMoveOut,
    rejectMoveOut,
    issueMoveOutPass,
    revokeAccess,
    completeMoveOut,
    cancelMoveOut
};
