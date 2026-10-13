
const { validate: isUUID } = require("uuid");

const allowedTransactionTypes = [
    "STOCK_IN",
    "STOCK_OUT",
    "TRANSFER",
    "ADJUSTMENT",
    "RETURN"
];

const isValidUUID = (value) => {
    return (
        typeof value === "string" &&
        value.trim() !== "" &&
        isUUID(value)
    );
};

const isValidPositiveNumber = (value) => {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return false;
    }

    const number = Number(value);

    return (
        !Number.isNaN(number) &&
        number > 0
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
        !Number.isNaN(number) &&
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

const validateCreateTransaction = (data) => {

    const errors = [];

    if (!data.inventoryId) {

        errors.push(
            "inventoryId is required"
        );

    } else if (
        !isValidUUID(data.inventoryId)
    ) {

        errors.push(
            "inventoryId must be a valid UUID"
        );
    }

    if (!data.transactionType) {

        errors.push(
            "transactionType is required"
        );

    } else if (
        !allowedTransactionTypes.includes(
            data.transactionType
        )
    ) {

        errors.push(
            `Invalid transactionType. Allowed values: ${allowedTransactionTypes.join(", ")}`
        );
    }

    if (
        !isValidPositiveNumber(
            data.quantity
        )
    ) {

        errors.push(
            "quantity must be a positive number"
        );
    }

    if (
        data.sourceInventoryId &&
        !isValidUUID(
            data.sourceInventoryId
        )
    ) {

        errors.push(
            "sourceInventoryId must be a valid UUID"
        );
    }

    if (
        data.destinationInventoryId &&
        !isValidUUID(
            data.destinationInventoryId
        )
    ) {

        errors.push(
            "destinationInventoryId must be a valid UUID"
        );
    }

    if (
        data.transactionDate &&
        !isValidDate(
            data.transactionDate
        )
    ) {

        errors.push(
            "transactionDate must be a valid date"
        );
    }

    if (
        data.newStock !== undefined &&
        !isValidNonNegativeNumber(
            data.newStock
        )
    ) {

        errors.push(
            "newStock must be a valid non-negative number"
        );
    }

    return errors;
};

module.exports = {
    validateCreateTransaction,
    allowedTransactionTypes
};

