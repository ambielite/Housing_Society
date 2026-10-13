const { validate: validateUUID } = require("uuid");

const DOCUMENT_TYPES = [
    "AADHAAR",
    "PAN",
    "PASSPORT",
    "DRIVING_LICENSE",
    "VOTER_ID",
    "RENT_AGREEMENT",
    "SALE_DEED",
    "PROPERTY_DOCUMENT",
    "ADDRESS_PROOF",
    "IDENTITY_PROOF",
    "OTHER"
];

const VERIFICATION_STATUSES = [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "REQUEST_MORE_INFORMATION"
];

const ACCESS_LEVELS = [
    "ADMIN_ONLY",
    "MANAGEMENT",
    "AUTHORIZED_STAFF"
];


// CREATE
const validateCreateKycDocument = (data) => {

    const errors = [];

    if (
        !data.societyId ||
        !validateUUID(data.societyId)
    ) {
        errors.push("Valid societyId is required");
    }

    if (
        !data.stakeholderId ||
        !validateUUID(data.stakeholderId)
    ) {
        errors.push("Valid stakeholderId is required");
    }

    if (
        !data.documentType ||
        !DOCUMENT_TYPES.includes(data.documentType)
    ) {
        errors.push(
            `documentType must be one of: ${DOCUMENT_TYPES.join(", ")}`
        );
    }

    if (
        !data.documentName ||
        typeof data.documentName !== "string"
    ) {
        errors.push("documentName is required");
    }

    if (
        data.verificationStatus &&
        !VERIFICATION_STATUSES.includes(
            data.verificationStatus
        )
    ) {
        errors.push(
            `verificationStatus must be one of: ${VERIFICATION_STATUSES.join(", ")}`
        );
    }

    if (
        data.accessLevel &&
        !ACCESS_LEVELS.includes(data.accessLevel)
    ) {
        errors.push(
            `accessLevel must be one of: ${ACCESS_LEVELS.join(", ")}`
        );
    }

    if (
        data.fileSize !== undefined &&
        (
            typeof data.fileSize !== "number" ||
            data.fileSize < 0
        )
    ) {
        errors.push("fileSize must be a valid positive number");
    }

    return errors;
};


// UPDATE
const validateUpdateKycDocument = (data) => {

    const errors = [];

    if (
        data.documentType &&
        !DOCUMENT_TYPES.includes(data.documentType)
    ) {
        errors.push(
            `documentType must be one of: ${DOCUMENT_TYPES.join(", ")}`
        );
    }

    if (
        data.verificationStatus &&
        !VERIFICATION_STATUSES.includes(
            data.verificationStatus
        )
    ) {
        errors.push(
            `verificationStatus must be one of: ${VERIFICATION_STATUSES.join(", ")}`
        );
    }

    if (
        data.accessLevel &&
        !ACCESS_LEVELS.includes(data.accessLevel)
    ) {
        errors.push(
            `accessLevel must be one of: ${ACCESS_LEVELS.join(", ")}`
        );
    }

    if (
        data.fileSize !== undefined &&
        (
            typeof data.fileSize !== "number" ||
            data.fileSize < 0
        )
    ) {
        errors.push("fileSize must be a valid positive number");
    }

    return errors;
};


// UUID
const validateId = (id) => {
    return validateUUID(id);
};


module.exports = {
    validateCreateKycDocument,
    validateUpdateKycDocument,
    validateId,
    DOCUMENT_TYPES,
    VERIFICATION_STATUSES,
    ACCESS_LEVELS
};