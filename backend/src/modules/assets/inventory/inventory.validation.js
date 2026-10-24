
const { validate: isUUID } = require("uuid");

const allowedStatuses = [
    "ACTIVE",
    "INACTIVE"
];

const isValidUUID = (value) => {
    return (
        typeof value === "string" &&
        value.trim() !== "" &&
        isUUID(value)
    );
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
        Number.isFinite(number) &&
        number >= 0
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

    return !Number.isNaN(
        date.getTime()
    );
};

const validateCreateInventory = (data) => {

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

    if (!data.itemCode) {

        errors.push(
            "itemCode is required"
        );

    } else if (
        typeof data.itemCode !== "string"
    ) {

        errors.push(
            "itemCode must be a string"
        );
    }

    if (!data.itemName) {

        errors.push(
            "itemName is required"
        );

    } else if (
        typeof data.itemName !== "string"
    ) {

        errors.push(
            "itemName must be a string"
        );
    }

    if (!data.unitOfMeasure) {

        errors.push(
            "unitOfMeasure is required"
        );

    } else if (
        typeof data.unitOfMeasure !== "string"
    ) {

        errors.push(
            "unitOfMeasure must be a string"
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
            data.currentStock
        )
    ) {

        errors.push(
            "currentStock must be a valid non-negative number"
        );
    }

    if (
        !isValidNonNegativeNumber(
            data.minimumStockLevel
        )
    ) {

        errors.push(
            "minimumStockLevel must be a valid non-negative number"
        );
    }

    if (
        !isValidNonNegativeNumber(
            data.reorderLevel
        )
    ) {

        errors.push(
            "reorderLevel must be a valid non-negative number"
        );
    }

    if (
        !isValidNonNegativeNumber(
            data.maximumStockLevel
        )
    ) {

        errors.push(
            "maximumStockLevel must be a valid non-negative number"
        );
    }

    if (
        !isValidNonNegativeNumber(
            data.unitCost
        )
    ) {

        errors.push(
            "unitCost must be a valid non-negative number"
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
        !isValidDate(data.lastStockInDate)
    ) {

        errors.push(
            "lastStockInDate must be a valid date"
        );
    }

    if (
        !isValidDate(data.lastStockOutDate)
    ) {

        errors.push(
            "lastStockOutDate must be a valid date"
        );
    }

    return errors;
};

const validateUpdateInventory = (data) => {

    const errors = [];

    if (
        data.vendorId &&
        !isValidUUID(data.vendorId)
    ) {

        errors.push(
            "vendorId must be a valid UUID"
        );
    }

    if (
        data.currentStock !== undefined &&
        !isValidNonNegativeNumber(
            data.currentStock
        )
    ) {

        errors.push(
            "currentStock must be a valid non-negative number"
        );
    }

    if (
        data.minimumStockLevel !== undefined &&
        !isValidNonNegativeNumber(
            data.minimumStockLevel
        )
    ) {

        errors.push(
            "minimumStockLevel must be a valid non-negative number"
        );
    }

    if (
        data.reorderLevel !== undefined &&
        !isValidNonNegativeNumber(
            data.reorderLevel
        )
    ) {

        errors.push(
            "reorderLevel must be a valid non-negative number"
        );
    }

    if (
        data.maximumStockLevel !== undefined &&
        !isValidNonNegativeNumber(
            data.maximumStockLevel
        )
    ) {

        errors.push(
            "maximumStockLevel must be a valid non-negative number"
        );
    }

    if (
        data.unitCost !== undefined &&
        !isValidNonNegativeNumber(
            data.unitCost
        )
    ) {

        errors.push(
            "unitCost must be a valid non-negative number"
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
        data.lastStockInDate &&
        !isValidDate(data.lastStockInDate)
    ) {

        errors.push(
            "lastStockInDate must be a valid date"
        );
    }

    if (
        data.lastStockOutDate &&
        !isValidDate(data.lastStockOutDate)
    ) {

        errors.push(
            "lastStockOutDate must be a valid date"
        );
    }

    return errors;
};

module.exports = {
    validateCreateInventory,
    validateUpdateInventory,
    allowedStatuses
};

