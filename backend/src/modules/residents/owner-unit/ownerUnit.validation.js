const { validate: validateUUID } = require("uuid");

const OWNERSHIP_TYPES = [
    "PRIMARY_OWNER",
    "CO_OWNER"
];

const STATUSES = [
    "ACTIVE",
    "INACTIVE"
];

const normalizeDate = (value, field, errors, optional = false) => {
    if (value === undefined) return undefined;
    if (value === null || value === "") {
        if (optional) return null;
        errors.push(`${field} is required`);
        return value;
    }
    if (typeof value !== "string") {
        errors.push(`${field} must be a valid date`);
        return value;
    }

    let year;
    let month;
    let day;
    let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (match) {
        [, year, month, day] = match;
    } else {
        match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
        if (!match) {
            errors.push(`${field} must be a valid date`);
            return value;
        }
        [, day, month, year] = match;
    }

    const iso = `${year}-${month}-${day}`;
    const parsed = new Date(`${iso}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso) {
        errors.push(`${field} must be a valid date`);
        return value;
    }
    return iso;
};

const normalizeOwnerUnitDates = (data) => {
    const errors = [];
    const normalized = { ...data };
    if (Object.hasOwn(data, "effectiveFrom")) {
        normalized.effectiveFrom = normalizeDate(data.effectiveFrom, "effectiveFrom", errors);
    }
    if (Object.hasOwn(data, "effectiveTo")) {
        normalized.effectiveTo = normalizeDate(data.effectiveTo, "effectiveTo", errors, true);
    }
    return { data: normalized, errors };
};

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

    if (data.effectiveTo && data.effectiveFrom && data.effectiveTo < data.effectiveFrom) {
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

    if (data.effectiveFrom && data.effectiveTo && data.effectiveTo < data.effectiveFrom) {
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
    normalizeOwnerUnitDates,
    OWNERSHIP_TYPES,
    STATUSES
};
