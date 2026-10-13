
const { validate: isUUID } = require("uuid");


// ======================================================
// ALLOWED STATUS
// ======================================================

const allowedStatuses = [
    "ACTIVE",
    "INACTIVE"
];


// ======================================================
// UUID VALIDATION
// ======================================================

const isValidUUID = (value) => {

    return (
        typeof value === "string" &&
        value.trim() !== "" &&
        isUUID(value)
    );
};


// ======================================================
// CREATE QR VALIDATION
// ======================================================

const validateCreateAssetQr = (data) => {

    const errors = [];


    // Asset ID

    if (!data.assetId) {

        errors.push(
            "assetId is required"
        );

    } else if (!isValidUUID(data.assetId)) {

        errors.push(
            "assetId must be a valid UUID"
        );
    }


    // Status

    if (data.status) {

        if (!allowedStatuses.includes(data.status)) {

            errors.push(
                `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`
            );
        }
    }


    // Remarks

    if (
        data.remarks !== undefined &&
        data.remarks !== null &&
        typeof data.remarks !== "string"
    ) {

        errors.push(
            "remarks must be a string"
        );
    }


    return errors;
};


// ======================================================
// UPDATE QR VALIDATION
// ======================================================

const validateUpdateAssetQr = (data) => {

    const errors = [];


    // Status

    if (data.status) {

        if (!allowedStatuses.includes(data.status)) {

            errors.push(
                `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`
            );
        }
    }


    // Remarks

    if (
        data.remarks !== undefined &&
        data.remarks !== null &&
        typeof data.remarks !== "string"
    ) {

        errors.push(
            "remarks must be a string"
        );
    }


    return errors;
};


module.exports = {

    validateCreateAssetQr,

    validateUpdateAssetQr,

    allowedStatuses

};

