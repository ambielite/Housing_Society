const { validate: validateUUID } = require("uuid");

const RESIDENT_ROLES = [
    "PRIMARY_OWNER",
    "CO_OWNER",
    "TENANT",
    "FAMILY_MEMBER",
    "PROPERTY_MANAGER"
];

const RESIDENT_STATUSES = [
    "PENDING",
    "ACTIVE",
    "SUSPENDED",
    "BLACKLISTED",
    "ARCHIVED"
];

const validateCreateResident = (data) => {

    const errors = [];

    if (data.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth)) errors.push("dateOfBirth must be a valid date");

    if (!data.societyId) {
        errors.push("societyId is required");
    } else if (!validateUUID(data.societyId)) {
        errors.push("Invalid societyId");
    }

    if (
        !data.firstName ||
        typeof data.firstName !== "string" ||
        !data.firstName.trim()
    ) {
        errors.push("firstName is required");
    }

    if (
        !data.lastName ||
        typeof data.lastName !== "string" ||
        !data.lastName.trim()
    ) {
        errors.push("lastName is required");
    }

    if (
        !data.mobile ||
        typeof data.mobile !== "string" ||
        !data.mobile.trim()
    ) {
        errors.push("mobile is required");
    }

    if (
        data.email &&
        (
            typeof data.email !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
        )
    ) {
        errors.push("Invalid email");
    }

    if (
        !data.role ||
        !RESIDENT_ROLES.includes(data.role)
    ) {
        errors.push(
            `role must be one of: ${RESIDENT_ROLES.join(", ")}`
        );
    }

    if (
        data.status &&
        !RESIDENT_STATUSES.includes(data.status)
    ) {
        errors.push(
            `status must be one of: ${RESIDENT_STATUSES.join(", ")}`
        );
    }

    if (
        data.directoryPhoneVisible !== undefined &&
        typeof data.directoryPhoneVisible !== "boolean"
    ) {
        errors.push(
            "directoryPhoneVisible must be true or false"
        );
    }

    if (
        data.personalFields !== undefined &&
        (
            typeof data.personalFields !== "object" ||
            Array.isArray(data.personalFields) ||
            data.personalFields === null
        )
    ) {
        errors.push(
            "personalFields must be an object"
        );
    }

    return errors;
};


const validateUpdateResident = (data) => {

    const errors = [];

    if (data.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth)) errors.push("dateOfBirth must be a valid date");

    if (
        data.email !== undefined &&
        data.email !== null &&
        (
            typeof data.email !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
        )
    ) {
        errors.push("Invalid email");
    }

    if (
        data.role &&
        !RESIDENT_ROLES.includes(data.role)
    ) {
        errors.push(
            `role must be one of: ${RESIDENT_ROLES.join(", ")}`
        );
    }

    if (
        data.status &&
        !RESIDENT_STATUSES.includes(data.status)
    ) {
        errors.push(
            `status must be one of: ${RESIDENT_STATUSES.join(", ")}`
        );
    }

    if (
        data.directoryPhoneVisible !== undefined &&
        typeof data.directoryPhoneVisible !== "boolean"
    ) {
        errors.push(
            "directoryPhoneVisible must be true or false"
        );
    }

    if (
        data.personalFields !== undefined &&
        (
            typeof data.personalFields !== "object" ||
            Array.isArray(data.personalFields) ||
            data.personalFields === null
        )
    ) {
        errors.push(
            "personalFields must be an object"
        );
    }

    return errors;
};


const validateId = (id) => {

    return validateUUID(id);
};


module.exports = {
    validateCreateResident,
    validateUpdateResident,
    validateId,
    RESIDENT_ROLES,
    RESIDENT_STATUSES
};
