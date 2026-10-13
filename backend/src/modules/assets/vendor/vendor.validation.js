const allowedStatuses = [
    "ACTIVE",
    "INACTIVE",
    "BLACKLISTED"
];

const validateCreateVendor = (data) => {
    const errors = [];

    if (!data.societyId) {
        errors.push(
            "societyId is required"
        );
    }

    if (!data.vendorCode) {
        errors.push(
            "vendorCode is required"
        );
    }

    if (!data.companyName) {
        errors.push(
            "companyName is required"
        );
    }

    if (
        data.status &&
        !allowedStatuses.includes(
            data.status
        )
    ) {
        errors.push(
            `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`
        );
    }

    if (
        data.email &&
        typeof data.email !== "string"
    ) {
        errors.push(
            "email must be a string"
        );
    }

    return errors;
};

const validateUpdateVendor = (data) => {
    const errors = [];

    if (
        data.status &&
        !allowedStatuses.includes(
            data.status
        )
    ) {
        errors.push(
            `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`
        );
    }

    return errors;
};

module.exports = {
    validateCreateVendor,
    validateUpdateVendor,
    allowedStatuses
};