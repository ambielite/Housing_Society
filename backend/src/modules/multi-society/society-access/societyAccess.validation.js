const { validate: validateUUID } = require("uuid");

const ACCESS_TYPES = [
    "OWNER",
    "ADMIN",
    "MANAGER",
    "DELEGATED_ADMIN",
    "VIEWER"
];

const validateCreateAccess = (data) => {

    const errors = [];

    if (!data.organizationId ||
        !validateUUID(data.organizationId)) {
        errors.push("Valid organizationId is required");
    }

    if (!data.societyId ||
        !validateUUID(data.societyId)) {
        errors.push("Valid societyId is required");
    }

    if (!data.userId ||
        !validateUUID(data.userId)) {
        errors.push("Valid userId is required");
    }

    if (
        data.clusterId &&
        !validateUUID(data.clusterId)
    ) {
        errors.push("Invalid clusterId");
    }

    if (
        data.accessType &&
        !ACCESS_TYPES.includes(data.accessType)
    ) {
        errors.push(
            `accessType must be one of: ${ACCESS_TYPES.join(", ")}`
        );
    }

    if (
        data.isDefault !== undefined &&
        typeof data.isDefault !== "boolean"
    ) {
        errors.push("isDefault must be true or false");
    }

    return errors;
};

const validateUpdateAccess = (data) => {

    const errors = [];

    if (
        data.accessType &&
        !ACCESS_TYPES.includes(data.accessType)
    ) {
        errors.push(
            `accessType must be one of: ${ACCESS_TYPES.join(", ")}`
        );
    }

    if (
        data.isDefault !== undefined &&
        typeof data.isDefault !== "boolean"
    ) {
        errors.push("isDefault must be true or false");
    }

    if (
        data.isActive !== undefined &&
        typeof data.isActive !== "boolean"
    ) {
        errors.push("isActive must be true or false");
    }

    return errors;
};

const validateId = (id) => {
    return validateUUID(id);
};

module.exports = {
    ACCESS_TYPES,
    validateCreateAccess,
    validateUpdateAccess,
    validateId
};