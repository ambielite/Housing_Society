const {
    validate: isUUID
} = require("uuid");


const allowedStatuses = [
    "DRAFT",
    "ACTIVE",
    "EXPIRING_SOON",
    "RENEWAL_INITIATED",
    "RENEWED",
    "EXPIRED",
    "TERMINATED"
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


const validateCreateAMC = (data) => {

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


    if (!data.amcNumber) {
        errors.push(
            "amcNumber is required"
        );
    }


    if (!data.vendorId) {
        errors.push(
            "vendorId is required"
        );
    } else if (
        !isValidUUID(data.vendorId)
    ) {
        errors.push(
            "vendorId must be a valid UUID"
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


    if (!data.endDate) {
        errors.push(
            "endDate is required"
        );
    } else if (
        !isValidDate(data.endDate)
    ) {
        errors.push(
            "endDate must be a valid date"
        );
    }


    if (
        data.contractCost === undefined ||
        data.contractCost === null
    ) {

        errors.push(
            "contractCost is required"
        );

    } else if (
        Number.isNaN(
            Number(data.contractCost)
        ) ||
        Number(data.contractCost) < 0
    ) {

        errors.push(
            "contractCost must be a valid non-negative number"
        );
    }


    if (
        data.responseTime !== undefined &&
        (
            Number.isNaN(
                Number(data.responseTime)
            ) ||
            Number(data.responseTime) < 0
        )
    ) {

        errors.push(
            "responseTime must be a valid non-negative number"
        );
    }


    if (
        data.resolutionTime !== undefined &&
        (
            Number.isNaN(
                Number(data.resolutionTime)
            ) ||
            Number(data.resolutionTime) < 0
        )
    ) {

        errors.push(
            "resolutionTime must be a valid non-negative number"
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


    return errors;
};


module.exports = {
    validateCreateAMC,
    allowedStatuses
};