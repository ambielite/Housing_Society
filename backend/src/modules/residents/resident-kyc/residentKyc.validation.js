const DOCUMENT_TYPES = [
    "AADHAAR",
    "PAN",
    "PASSPORT",
    "DRIVING_LICENSE",
    "VOTER_ID",
    "ADDRESS_PROOF",
    "RENT_AGREEMENT",
    "OWNERSHIP_PROOF",
    "POLICE_VERIFICATION",
    "OTHER"
];

const VERIFICATION_STATUSES = [
    "PENDING",
    "VERIFIED",
    "REJECTED",
    "EXPIRED"
];

const ACCESS_LEVELS = [
    "PRIVATE",
    "ADMIN_ONLY",
    "VERIFICATION_TEAM",
    "AUTHORIZED_STAFF"
];

const validateCreateKyc = (req, res, next) => {
    const {
        societyId,
        stakeholderId,
        documentType,
        documentName
    } = req.body;

    if (!societyId) {
        return res.status(400).json({
            success: false,
            message: "societyId is required"
        });
    }

    if (!stakeholderId) {
        return res.status(400).json({
            success: false,
            message: "stakeholderId is required"
        });
    }

    if (!documentType) {
        return res.status(400).json({
            success: false,
            message: "documentType is required"
        });
    }

    if (!DOCUMENT_TYPES.includes(documentType)) {
        return res.status(400).json({
            success: false,
            message: `Invalid documentType. Allowed values: ${DOCUMENT_TYPES.join(", ")}`
        });
    }

    if (!documentName) {
        return res.status(400).json({
            success: false,
            message: "documentName is required"
        });
    }

    if (req.body.accessLevel &&
        !ACCESS_LEVELS.includes(req.body.accessLevel)) {
        return res.status(400).json({
            success: false,
            message: `Invalid accessLevel. Allowed values: ${ACCESS_LEVELS.join(", ")}`
        });
    }

    next();
};


const validateUpdateKyc = (req, res, next) => {
    if (
        req.body.documentType &&
        !DOCUMENT_TYPES.includes(req.body.documentType)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid documentType"
        });
    }

    if (
        req.body.verificationStatus &&
        !VERIFICATION_STATUSES.includes(req.body.verificationStatus)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid verificationStatus"
        });
    }

    if (
        req.body.accessLevel &&
        !ACCESS_LEVELS.includes(req.body.accessLevel)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid accessLevel"
        });
    }

    next();
};


const validateId = (req, res, next) => {
    if (!req.params.id) {
        return res.status(400).json({
            success: false,
            message: "Document id is required"
        });
    }

    next();
};


module.exports = {
    validateCreateKyc,
    validateUpdateKyc,
    validateId,
    DOCUMENT_TYPES,
    VERIFICATION_STATUSES,
    ACCESS_LEVELS
};