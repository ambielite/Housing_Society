const MEMBER_TYPES = [
    "SHOP",
    "SERVICE_PROVIDER",
    "TUTOR",
    "COMMERCIAL_OCCUPANT",
    "DOMESTIC_WORKER",
    "CONTRACTOR",
    "VENDOR",
    "OTHER"
];

const STATUSES = [
    "PENDING",
    "ACTIVE",
    "SUSPENDED",
    "BLACKLISTED",
    "ARCHIVED"
];

const validateCreate = (req, res, next) => {
    const {
        societyId,
        memberType,
        name,
        mobile
    } = req.body;

    if (!societyId) {
        return res.status(400).json({
            success: false,
            message: "societyId is required"
        });
    }

    if (!memberType) {
        return res.status(400).json({
            success: false,
            message: "memberType is required"
        });
    }

    if (!MEMBER_TYPES.includes(memberType)) {
        return res.status(400).json({
            success: false,
            message: "Invalid memberType"
        });
    }

    if (!name) {
        return res.status(400).json({
            success: false,
            message: "name is required"
        });
    }

    if (!mobile) {
        return res.status(400).json({
            success: false,
            message: "mobile is required"
        });
    }

    if (
        req.body.startDate &&
        req.body.endDate &&
        new Date(req.body.endDate) < new Date(req.body.startDate)
    ) {
        return res.status(400).json({
            success: false,
            message: "endDate cannot be before startDate"
        });
    }

    next();
};

const validateUpdate = (req, res, next) => {
    if (
        req.body.memberType &&
        !MEMBER_TYPES.includes(req.body.memberType)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid memberType"
        });
    }

    if (
        req.body.status &&
        !STATUSES.includes(req.body.status)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid status"
        });
    }

    if (
        req.body.startDate &&
        req.body.endDate &&
        new Date(req.body.endDate) < new Date(req.body.startDate)
    ) {
        return res.status(400).json({
            success: false,
            message: "endDate cannot be before startDate"
        });
    }

    next();
};

const validateStatus = (req, res, next) => {
    if (!req.body.status) {
        return res.status(400).json({
            success: false,
            message: "status is required"
        });
    }

    if (!STATUSES.includes(req.body.status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid status"
        });
    }

    next();
};

const validateId = (req, res, next) => {
    if (!req.params.id) {
        return res.status(400).json({
            success: false,
            message: "Non-member ID is required"
        });
    }

    next();
};

module.exports = {
    MEMBER_TYPES,
    STATUSES,
    validateCreate,
    validateUpdate,
    validateStatus,
    validateId
};