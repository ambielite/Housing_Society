
const { validate: isUUID } = require("uuid");

const allowedMaintenanceTypes = [
    "PREVENTIVE",
    "CORRECTIVE",
    "BREAKDOWN",
    "INSPECTION",
    "SERVICING",
    "REPAIR",
    "OTHER"
];

const allowedStatuses = [
    "SCHEDULED",
    "IN_PROGRESS",
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
        return true;
    }

    const date = new Date(value);

    return !Number.isNaN(date.getTime());
};

const isValidNonNegativeNumber = (value) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return true;
    }

    const number = Number(value);

    return (
        !Number.isNaN(number) &&
        number >= 0
    );
};

const validateCreateMaintenance = (data) => {
    const errors = [];

    if (!data.assetId) {
        errors.push("assetId is required");
    } else if (!isValidUUID(data.assetId)) {
        errors.push("assetId must be a valid UUID");
    }

    if (!data.maintenanceType) {
        errors.push("maintenanceType is required");
    } else if (
        !allowedMaintenanceTypes.includes(
            data.maintenanceType
        )
    ) {
        errors.push(
            `Invalid maintenanceType. Allowed values: ${allowedMaintenanceTypes.join(", ")}`
        );
    }

    if (!data.serviceDate) {
        errors.push("serviceDate is required");
    } else if (!isValidDate(data.serviceDate)) {
        errors.push("serviceDate must be a valid date");
    }

    if (
        data.completionDate &&
        !isValidDate(data.completionDate)
    ) {
        errors.push(
            "completionDate must be a valid date"
        );
    }

    if (
        data.nextServiceDate &&
        !isValidDate(data.nextServiceDate)
    ) {
        errors.push(
            "nextServiceDate must be a valid date"
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

    if (
        !isValidNonNegativeNumber(
            data.maintenanceCost
        )
    ) {
        errors.push(
            "maintenanceCost must be a valid non-negative number"
        );
    }

    if (
        !isValidNonNegativeNumber(
            data.partsCost
        )
    ) {
        errors.push(
            "partsCost must be a valid non-negative number"
        );
    }

    if (
        !isValidNonNegativeNumber(
            data.laborCost
        )
    ) {
        errors.push(
            "laborCost must be a valid non-negative number"
        );
    }

    if (
        !isValidNonNegativeNumber(
            data.downtimeHours
        )
    ) {
        errors.push(
            "downtimeHours must be a valid non-negative number"
        );
    }

    return errors;
};

const validateUpdateMaintenance = (data) => {
    const errors = [];

    if (
        data.maintenanceType &&
        !allowedMaintenanceTypes.includes(
            data.maintenanceType
        )
    ) {
        errors.push(
            `Invalid maintenanceType. Allowed values: ${allowedMaintenanceTypes.join(", ")}`
        );
    }

    if (
        data.maintenanceStatus &&
        !allowedStatuses.includes(
            data.maintenanceStatus
        )
    ) {
        errors.push(
            `Invalid maintenanceStatus. Allowed values: ${allowedStatuses.join(", ")}`
        );
    }

    if (
        data.serviceDate &&
        !isValidDate(data.serviceDate)
    ) {
        errors.push(
            "serviceDate must be a valid date"
        );
    }

    if (
        data.completionDate &&
        !isValidDate(data.completionDate)
    ) {
        errors.push(
            "completionDate must be a valid date"
        );
    }

    if (
        data.nextServiceDate &&
        !isValidDate(data.nextServiceDate)
    ) {
        errors.push(
            "nextServiceDate must be a valid date"
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

    if (
        !isValidNonNegativeNumber(
            data.maintenanceCost
        )
    ) {
        errors.push(
            "maintenanceCost must be a valid non-negative number"
        );
    }

    if (
        !isValidNonNegativeNumber(
            data.partsCost
        )
    ) {
        errors.push(
            "partsCost must be a valid non-negative number"
        );
    }

    if (
        !isValidNonNegativeNumber(
            data.laborCost
        )
    ) {
        errors.push(
            "laborCost must be a valid non-negative number"
        );
    }

    if (
        !isValidNonNegativeNumber(
            data.downtimeHours
        )
    ) {
        errors.push(
            "downtimeHours must be a valid non-negative number"
        );
    }

    return errors;
};

module.exports = {
    validateCreateMaintenance,
    validateUpdateMaintenance,
    allowedMaintenanceTypes,
    allowedStatuses
};

