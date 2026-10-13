const service = require("./moveIn.service");

const createMoveIn = async (req, res) => {
    try {
        const moveIn = await service.createMoveIn(req.body);

        return res.status(201).json({
            success: true,
            message: "Move-in request created successfully",
            data: moveIn
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getMoveIns = async (req, res) => {
    try {
        const moveIns = await service.getMoveIns();

        return res.status(200).json({
            success: true,
            data: moveIns
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getMoveIn = async (req, res) => {
    try {
        const moveIn = await service.getMoveIn(req.params.id);

        if (!moveIn) {
            return res.status(404).json({
                success: false,
                message: "Move-in request not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: moveIn
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const updateMoveIn = async (req, res) => {
    try {
        const moveIn = await service.updateMoveIn(
            req.params.id,
            req.body
        );

        if (!moveIn) {
            return res.status(404).json({
                success: false,
                message: "Move-in request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Move-in request updated successfully",
            data: moveIn
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const submitDocuments = async (req, res) => {
    try {
        const moveIn = await service.submitDocuments(
            req.params.id
        );

        if (!moveIn) {
            return res.status(404).json({
                success: false,
                message: "Move-in request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Move-in documents submitted successfully",
            data: moveIn
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
        const moveIn = await service.requestMoveInInformation(req.params.id, req.body.informationRequest);
        if (!moveIn) return res.status(404).json({ success: false, message: "Move-in request not found" });
        return res.status(200).json({ success: true, message: "Additional information requested", data: moveIn });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const startVerification = async (req, res) => {
    try {
        const moveIn = await service.startVerification(
            req.params.id
        );

        if (!moveIn) {
            return res.status(404).json({
                success: false,
                message: "Move-in request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Move-in verification started",
            data: moveIn
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const approveMoveIn = async (req, res) => {
    try {
        const moveIn = await service.approveMoveIn(
            req.params.id,
            req.body.approvedBy
        );

        if (!moveIn) {
            return res.status(404).json({
                success: false,
                message: "Move-in request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Move-in approved successfully",
            data: moveIn
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const rejectMoveIn = async (req, res) => {
    try {
        const moveIn = await service.rejectMoveIn(
            req.params.id,
            req.body.remarks
        );

        if (!moveIn) {
            return res.status(404).json({
                success: false,
                message: "Move-in request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Move-in rejected",
            data: moveIn
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const issueGatePass = async (req, res) => {
    try {
        const moveIn = await service.issueGatePass(
            req.params.id
        );

        if (!moveIn) {
            return res.status(404).json({
                success: false,
                message: "Move-in request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Move-in gate pass issued",
            data: moveIn
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const markLedgerCreated = async (req, res) => {
    try {
        const moveIn = await service.markLedgerCreated(
            req.params.id
        );

        if (!moveIn) {
            return res.status(404).json({
                success: false,
                message: "Move-in request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Move-in ledger marked as created",
            data: moveIn
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const activateAccess = async (req, res) => {
    try {
        const moveIn = await service.activateAccess(
            req.params.id
        );

        if (!moveIn) {
            return res.status(404).json({
                success: false,
                message: "Move-in request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Resident access activated",
            data: moveIn
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const completeMoveIn = async (req, res) => {
    try {
        const moveIn = await service.completeMoveIn(
            req.params.id
        );

        if (!moveIn) {
            return res.status(404).json({
                success: false,
                message: "Move-in request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Move-in lifecycle completed successfully",
            data: moveIn
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const deleteMoveIn = async (req, res) => {
    try {
        const moveIn = await service.deleteMoveIn(req.params.id);

        if (!moveIn) {
            return res.status(404).json({
                success: false,
                message: "Move-in request not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Move-in request deleted successfully",
            data: moveIn
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createMoveIn,
    getMoveIns,
    getMoveIn,
    updateMoveIn,
    deleteMoveIn,
    submitDocuments,
    requestInformation,
    startVerification,
    approveMoveIn,
    rejectMoveIn,
    issueGatePass,
    markLedgerCreated,
    activateAccess,
    completeMoveIn
};
