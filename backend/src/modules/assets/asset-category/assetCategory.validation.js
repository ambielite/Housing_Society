const allowedStatuses = [
    "ACTIVE",
    "INACTIVE"
];


const validateCreateCategory = (data) => {

    const errors = [];

    if (!data.societyId) {
        errors.push(
            "societyId is required"
        );
    }

    if (!data.categoryCode) {
        errors.push(
            "categoryCode is required"
        );
    }

    if (!data.categoryName) {
        errors.push(
            "categoryName is required"
        );
    }

    if (
        data.status &&
        !allowedStatuses.includes(data.status)
    ) {
        errors.push(
            `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`
        );
    }

    return errors;
};


const validateUpdateCategory = (data) => {

    const errors = [];

    if (
        data.status &&
        !allowedStatuses.includes(data.status)
    ) {
        errors.push(
            `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`
        );
    }

    return errors;
};


module.exports = {
    validateCreateCategory,
    validateUpdateCategory,
    allowedStatuses
};