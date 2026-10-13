const { validate: isUUID } = require("uuid");

const validateCreateDocument = (
    req,
    res,
    next
) => {
    const {
        lifecycleType,
        lifecycleId,
        documentType,
        documentName
    } = req.body;

    if (
        !lifecycleType ||
        !["MOVE_IN", "MOVE_OUT"].includes(
            lifecycleType
        )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "lifecycleType must be MOVE_IN or MOVE_OUT"
        });
    }

    if (
        !lifecycleId ||
        !isUUID(lifecycleId)
    ) {
        return res.status(400).json({
            success: false,
            message: "Valid lifecycleId is required"
        });
    }

    if (!documentType) {
        return res.status(400).json({
            success: false,
            message: "documentType is required"
        });
    }

    if (!documentName) {
        return res.status(400).json({
            success: false,
            message: "documentName is required"
        });
    }

    next();
};

const validateDocumentId = (
    req,
    res,
    next
) => {
    if (!isUUID(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid document ID"
        });
    }

    next();
};

const validateLifecycle = (
    req,
    res,
    next
) => {
    const {
        lifecycleType,
        lifecycleId
    } = req.params;

    if (
        !["MOVE_IN", "MOVE_OUT"].includes(
            lifecycleType
        )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid lifecycle type"
        });
    }

    if (!isUUID(lifecycleId)) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid lifecycle ID"
        });
    }

    next();
};

const validateVerification = (
    req,
    res,
    next
) => {
    if (
        !req.body.verifiedBy ||
        !isUUID(req.body.verifiedBy)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Valid verifiedBy UUID is required"
        });
    }

    next();
};

const validateRejection = (
    req,
    res,
    next
) => {
    if (
        !req.body.verifiedBy ||
        !isUUID(req.body.verifiedBy)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Valid verifiedBy UUID is required"
        });
    }

    if (
        !req.body.remarks ||
        !req.body.remarks.trim()
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Remarks are required for rejection"
        });
    }

    next();
};

module.exports = {
    validateCreateDocument,
    validateDocumentId,
    validateLifecycle,
    validateVerification,
    validateRejection
};