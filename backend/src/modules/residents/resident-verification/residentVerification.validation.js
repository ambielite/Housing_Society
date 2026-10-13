const VERIFICATION_TYPES = [
    "INITIAL_REGISTRATION",
    "KYC",
    "OWNER_VERIFICATION",
    "TENANT_VERIFICATION",
    "PROFILE_UPDATE",
    "DOCUMENT_REVERIFICATION"
];

const VERIFICATION_STATUSES = [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "MORE_INFORMATION_REQUIRED"
];

const STAKEHOLDER_STATUSES = [
    "PENDING",
    "ACTIVE",
    "SUSPENDED",
    "BLACKLISTED",
    "ARCHIVED"
];

const validateCreateVerification = (req, res, next) => {
    const {
        societyId,
        residentId,
        verificationType
    } = req.body;

    if (!societyId) {
        return res.status(400).json({
            success: false,
            message: "societyId is required"
        });
    }

    if (!residentId) {
        return res.status(400).json({
            success: false,
            message: "residentId is required"
        });
    }

    if (
        verificationType &&
        !VERIFICATION_TYPES.includes(verificationType)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid verificationType"
        });
    }

    next();
};

const validateReview = (req, res, next) => {
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({
            success: false,
            message: "status is required"
        });
    }

    if (!VERIFICATION_STATUSES.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid verification status"
        });
    }

    if (status === "REJECTED" && !req.body.rejectionReason) {
        return res.status(400).json({
            success: false,
            message: "rejectionReason is required when rejecting"
        });
    }

    if (
        status === "MORE_INFORMATION_REQUIRED" &&
        !req.body.informationRequest
    ) {
        return res.status(400).json({
            success: false,
            message:
                "informationRequest is required when requesting more information"
        });
    }

    next();
};

const validateStatusUpdate = (req, res, next) => {
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({
            success: false,
            message: "status is required"
        });
    }

    if (!STAKEHOLDER_STATUSES.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid stakeholder status"
        });
    }

    next();
};

const validateId = (req, res, next) => {
    if (!req.params.id) {
        return res.status(400).json({
            success: false,
            message: "Verification ID is required"
        });
    }

    next();
};

module.exports = {
    VERIFICATION_TYPES,
    VERIFICATION_STATUSES,
    STAKEHOLDER_STATUSES,
    validateCreateVerification,
    validateReview,
    validateStatusUpdate,
    validateId
};