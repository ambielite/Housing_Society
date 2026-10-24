const service = require("./moveIn.service");

const createMoveIn = async (req, res) => {
    try {
        const moveIn = await service.createMoveIn(req.body, req.files);

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

const getMoveInDocument = async (req, res) => {
    try {
        const document = await service.getMoveInDocument(req.params.id, req.params.documentType);
        if (!document) {
            return res.status(404).json({ success: false, message: "Move-in document not found" });
        }
        if (String(document.society_id) !== String(req.user.societyId)) {
            return res.status(403).json({ success: false, message: "You do not have access to this society document" });
        }

        const safeFilename = encodeURIComponent(document.original_filename).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
        res.setHeader("Content-Type", document.mime_type);
        res.setHeader("Content-Length", String(document.file_size));
        res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${safeFilename}`);
        res.setHeader("X-Content-Type-Options", "nosniff");
        return res.send(document.content);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateMoveIn = async (req, res) => {
    try {
        const moveIn = await service.updateMoveIn(
            req.params.id,
            req.body,
            req.files
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
    getMoveInDocument,
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
