
const { validate: isUUID } = require("uuid");


// ======================================================
// ALLOWED DOCUMENT TYPES
// ======================================================

const allowedDocumentTypes = [

    "PURCHASE_INVOICE",

    "WARRANTY_CERTIFICATE",

    "AMC_DOCUMENT",

    "USER_MANUAL",

    "SERVICE_DOCUMENT",

    "INSURANCE_DOCUMENT",

    "OTHER"
];


// ======================================================
// ALLOWED STATUS
// ======================================================

const allowedStatuses = [

    "ACTIVE",

    "EXPIRED",

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
// DATE VALIDATION
// ======================================================

const isValidDate = (value) => {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return true;
    }


    const date =
        new Date(value);


    return !Number.isNaN(
        date.getTime()
    );
};


// ======================================================
// CREATE VALIDATION
// ======================================================

const validateCreateAssetDocument = (
    data
) => {

    const errors = [];


    // Asset ID

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


    // Document Type

    if (!data.documentType) {

        errors.push(
            "documentType is required"
        );

    } else if (
        !allowedDocumentTypes.includes(
            data.documentType
        )
    ) {

        errors.push(

            `Invalid documentType. Allowed values: ${allowedDocumentTypes.join(", ")}`
        );
    }


    // Document Name

    if (!data.documentName) {

        errors.push(
            "documentName is required"
        );

    } else if (
        typeof data.documentName !== "string"
    ) {

        errors.push(
            "documentName must be a string"
        );
    }


    // Document Number

    if (
        data.documentNumber !== undefined &&
        data.documentNumber !== null &&
        typeof data.documentNumber !== "string"
    ) {

        errors.push(
            "documentNumber must be a string"
        );
    }


    // Dates

    if (
        !isValidDate(
            data.issueDate
        )
    ) {

        errors.push(
            "issueDate must be a valid date"
        );
    }


    if (
        !isValidDate(
            data.expiryDate
        )
    ) {

        errors.push(
            "expiryDate must be a valid date"
        );
    }


    if (
        !isValidDate(
            data.warrantyStartDate
        )
    ) {

        errors.push(
            "warrantyStartDate must be a valid date"
        );
    }


    if (
        !isValidDate(
            data.warrantyEndDate
        )
    ) {

        errors.push(
            "warrantyEndDate must be a valid date"
        );
    }


    // Status

    if (data.status) {

        if (
            !allowedStatuses.includes(
                data.status
            )
        ) {

            errors.push(

                `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`
            );
        }
    }


    return errors;
};


// ======================================================
// UPDATE VALIDATION
// ======================================================

const validateUpdateAssetDocument = (
    data
) => {

    const errors = [];


    // Document Type

    if (
        data.documentType &&
        !allowedDocumentTypes.includes(
            data.documentType
        )
    ) {

        errors.push(

            `Invalid documentType. Allowed values: ${allowedDocumentTypes.join(", ")}`
        );
    }


    // Document Name

    if (
        data.documentName !== undefined &&
        typeof data.documentName !== "string"
    ) {

        errors.push(
            "documentName must be a string"
        );
    }


    // Dates

    if (
        !isValidDate(
            data.issueDate
        )
    ) {

        errors.push(
            "issueDate must be a valid date"
        );
    }


    if (
        !isValidDate(
            data.expiryDate
        )
    ) {

        errors.push(
            "expiryDate must be a valid date"
        );
    }


    if (
        !isValidDate(
            data.warrantyStartDate
        )
    ) {

        errors.push(
            "warrantyStartDate must be a valid date"
        );
    }


    if (
        !isValidDate(
            data.warrantyEndDate
        )
    ) {

        errors.push(
            "warrantyEndDate must be a valid date"
        );
    }


    // Status

    if (data.status) {

        if (
            !allowedStatuses.includes(
                data.status
            )
        ) {

            errors.push(

                `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`
            );
        }
    }


    return errors;
};


module.exports = {

    validateCreateAssetDocument,

    validateUpdateAssetDocument,

    allowedDocumentTypes,

    allowedStatuses
};

