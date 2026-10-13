
const {
    validate: isUUID
} = require("uuid");


const allowedPriorities = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL"
];


const allowedStatuses = [
    "OPEN",
    "ASSIGNED",
    "IN_PROGRESS",
    "ON_HOLD",
    "COMPLETED",
    "CANCELLED"
];


const isValidUUID = (value) => {

    return (
        typeof value === "string" &&
        value.trim() !== "" &&
        isUUID(value)
    );
};


const isValidDate = (value) => {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return false;
    }

    const date = new Date(value);

    return !Number.isNaN(
        date.getTime()
    );
};


const validateCreateWorkOrder = (
    data
) => {

    const errors = [];


    if (!data.societyId) {

        errors.push(
            "societyId is required"
        );

    } else if (
        !isValidUUID(data.societyId)
    ) {

        errors.push(
            "societyId must be a valid UUID"
        );
    }


    if (!data.assetId) {

        errors.push(
            "assetId is required"
        );

    } else if (
        !isValidUUID(data.assetId)
    ) {

        errors.push(
            "assetId must be a valid UUID"
        );
    }


    if (
        data.scheduleId &&
        !isValidUUID(data.scheduleId)
    ) {

        errors.push(
            "scheduleId must be a valid UUID"
        );
    }


    if (
        data.amcId &&
        !isValidUUID(data.amcId)
    ) {

        errors.push(
            "amcId must be a valid UUID"
        );
    }


    if (
        data.vendorId &&
        !isValidUUID(data.vendorId)
    ) {

        errors.push(
            "vendorId must be a valid UUID"
        );
    }


    if (!data.workOrderNumber) {

        errors.push(
            "workOrderNumber is required"
        );
    }


    if (!data.title) {

        errors.push(
            "title is required"
        );
    }


    if (!data.scheduledDate) {

        errors.push(
            "scheduledDate is required"
        );

    } else if (
        !isValidDate(
            data.scheduledDate
        )
    ) {

        errors.push(
            "scheduledDate must be a valid date"
        );
    }


    if (
        data.priority &&
        !allowedPriorities.includes(
            data.priority
        )
    ) {

        errors.push(
            `Invalid priority. Allowed values: ${allowedPriorities.join(", ")}`
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
        data.estimatedCost !== undefined &&
        (
            Number.isNaN(
                Number(data.estimatedCost)
            ) ||
            Number(data.estimatedCost) < 0
        )
    ) {

        errors.push(
            "estimatedCost must be a valid non-negative number"
        );
    }


    return errors;
};


module.exports = {
    validateCreateWorkOrder,
    allowedPriorities,
    allowedStatuses
};

