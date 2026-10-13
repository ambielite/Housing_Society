
const {
    validate: isUUID
} = require("uuid");


const allowedFrequencyTypes = [
    "DAILY",
    "WEEKLY",
    "MONTHLY",
    "QUARTERLY",
    "HALF_YEARLY",
    "YEARLY",
    "CUSTOM"
];


const allowedPriorities = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL"
];


const allowedStatuses = [
    "ACTIVE",
    "PAUSED",
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


const validateCreateSchedule = (data) => {

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


    if (!data.scheduleCode) {
        errors.push(
            "scheduleCode is required"
        );
    }


    if (!data.maintenanceTitle) {
        errors.push(
            "maintenanceTitle is required"
        );
    }


    if (!data.frequencyType) {

        errors.push(
            "frequencyType is required"
        );

    } else if (
        !allowedFrequencyTypes.includes(
            data.frequencyType
        )
    ) {

        errors.push(
            `Invalid frequencyType. Allowed values: ${allowedFrequencyTypes.join(", ")}`
        );
    }


    if (!data.startDate) {
        errors.push(
            "startDate is required"
        );
    } else if (
        !isValidDate(data.startDate)
    ) {
        errors.push(
            "startDate must be a valid date"
        );
    }


    if (!data.nextDueDate) {
        errors.push(
            "nextDueDate is required"
        );
    } else if (
        !isValidDate(data.nextDueDate)
    ) {
        errors.push(
            "nextDueDate must be a valid date"
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
    validateCreateSchedule,
    allowedFrequencyTypes,
    allowedPriorities,
    allowedStatuses
};

