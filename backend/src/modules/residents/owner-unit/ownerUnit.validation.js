const { validate: validateUUID } = require("uuid");

const OWNERSHIP_TYPES = [
    "PRIMARY_OWNER",
    "CO_OWNER"
];

const STATUSES = [
    "ACTIVE",
    "INACTIVE"
];

const validateCreateOwnerUnit = (data) => {

    const errors = [];

    if (
        !data.societyId ||
        !validateUUID(data.societyId)
    ) {
        errors.push("Valid societyId is required");
    }

    if (
        !data.ownerId ||
        !validateUUID(data.ownerId)
    ) {
        errors.push("Valid ownerId is required");
    }

    if (
        !data.unitId ||
        !validateUUID(data.unitId)
    ) {
        errors.push("Valid unitId is required");
    }

    if (
        data.ownershipType &&
        !OWNERSHIP_TYPES.includes(
            data.ownershipType
        )
    ) {
        errors.push(
            `ownershipType must be one of: ${OWNERSHIP_TYPES.join(", ")}`
        );
    }

    if (
        data.ownershipPercentage !== undefined &&
        data.ownershipPercentage !== null
    ) {
        const percentage =
            Number(data.ownershipPercentage);

        if (
            Number.isNaN(percentage) ||
            percentage <= 0 ||
            percentage > 100
        ) {
            errors.push(
                "ownershipPercentage must be between 0 and 100"
            );
        }
    }

    if (!data.effectiveFrom) {
        errors.push(
            "effectiveFrom is required"
        );
    }

    if (
        data.effectiveTo &&
        data.effectiveFrom &&
        new Date(data.effectiveTo) <
        new Date(data.effectiveFrom)
    ) {
        errors.push(
            "effectiveTo cannot be before effectiveFrom"
        );
    }

    if (
        data.status &&
        !STATUSES.includes(data.status)
    ) {
        errors.push(
            `status must be one of: ${STATUSES.join(", ")}`
        );
    }

    return errors;
};


const validateUpdateOwnerUnit = (data) => {

    const errors = [];

    if (
        data.ownershipType &&
        !OWNERSHIP_TYPES.includes(
            data.ownershipType
        )
    ) {
        errors.push(
            `ownershipType must be one of: ${OWNERSHIP_TYPES.join(", ")}`
        );
    }

    if (
        data.ownershipPercentage !== undefined &&
        data.ownershipPercentage !== null
    ) {
        const percentage =
            Number(data.ownershipPercentage);

        if (
            Number.isNaN(percentage) ||
            percentage <= 0 ||
            percentage > 100
        ) {
            errors.push(
                "ownershipPercentage must be between 0 and 100"
            );
        }
    }

    if (
        data.status &&
        !STATUSES.includes(data.status)
    ) {
        errors.push(
            `status must be one of: ${STATUSES.join(", ")}`
        );
    }

    if (
        data.effectiveFrom &&
        data.effectiveTo &&
        new Date(data.effectiveTo) <
        new Date(data.effectiveFrom)
    ) {
        errors.push(
            "effectiveTo cannot be before effectiveFrom"
        );
    }

    return errors;
};


const validateId = (id) => {
    return validateUUID(id);
};


module.exports = {
    validateCreateOwnerUnit,
    validateUpdateOwnerUnit,
    validateId,
    OWNERSHIP_TYPES,
    STATUSES
};