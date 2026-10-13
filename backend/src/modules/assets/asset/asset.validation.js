
const { validate: isUUID } = require("uuid");


// ======================================================
// ALLOWED VALUES
// ======================================================

const allowedStatuses = [
    "PURCHASED",
    "ACTIVE",
    "UNDER_MAINTENANCE",
    "DAMAGED",
    "LOST",
    "RETIRED",
    "DISPOSED"
];

const allowedConditions = [
    "NEW",
    "GOOD",
    "FAIR",
    "DAMAGED",
    "CRITICAL"
];


// ======================================================
// UUID VALIDATION
// ======================================================

const isValidUUID = (value) => {

    if (
        typeof value !== "string" ||
        value.trim() === ""
    ) {
        return false;
    }

    return isUUID(value);
};


// ======================================================
// NUMBER VALIDATION
// ======================================================

const isValidNonNegativeNumber = (value) => {

    // Optional field
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


// ======================================================
// DATE VALIDATION
// ======================================================

const isValidDate = (value) => {

    // Optional field
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


// ======================================================
// CREATE ASSET VALIDATION
// ======================================================

const validateCreateAsset = (data) => {

    const errors = [];


    // --------------------------------------------------
    // SOCIETY
    // --------------------------------------------------

    if (!data.societyId) {

        errors.push(
            "societyId is required"
        );

    } else if (!isValidUUID(data.societyId)) {

        errors.push(
            "societyId must be a valid UUID"
        );
    }


    // --------------------------------------------------
    // ASSET CODE
    // --------------------------------------------------

    if (!data.assetCode) {

        errors.push(
            "assetCode is required"
        );

    } else if (
        typeof data.assetCode !== "string"
    ) {

        errors.push(
            "assetCode must be a string"
        );
    }


    // --------------------------------------------------
    // ASSET NAME
    // --------------------------------------------------

    if (!data.assetName) {

        errors.push(
            "assetName is required"
        );

    } else if (
        typeof data.assetName !== "string"
    ) {

        errors.push(
            "assetName must be a string"
        );
    }


    // --------------------------------------------------
    // ASSET TYPE
    // --------------------------------------------------

    if (!data.assetType) {

        errors.push(
            "assetType is required"
        );

    } else if (
        typeof data.assetType !== "string"
    ) {

        errors.push(
            "assetType must be a string"
        );
    }


    // --------------------------------------------------
    // CATEGORY
    // --------------------------------------------------

    if (data.categoryId) {

        if (!isValidUUID(data.categoryId)) {

            errors.push(
                "categoryId must be a valid UUID"
            );
        }
    }


    // --------------------------------------------------
    // VENDOR
    // --------------------------------------------------

    if (data.vendorId) {

        if (!isValidUUID(data.vendorId)) {

            errors.push(
                "vendorId must be a valid UUID"
            );
        }
    }


    // --------------------------------------------------
    // TOWER
    // --------------------------------------------------

    if (data.towerId) {

        if (!isValidUUID(data.towerId)) {

            errors.push(
                "towerId must be a valid UUID"
            );
        }
    }


    // --------------------------------------------------
    // FLOOR
    // --------------------------------------------------

    if (data.floorId) {

        if (!isValidUUID(data.floorId)) {

            errors.push(
                "floorId must be a valid UUID"
            );
        }
    }


    // --------------------------------------------------
    // UNIT
    // --------------------------------------------------

    if (data.unitId) {

        if (!isValidUUID(data.unitId)) {

            errors.push(
                "unitId must be a valid UUID"
            );
        }
    }


    // --------------------------------------------------
    // STATUS
    // --------------------------------------------------

    if (data.status) {

        if (!allowedStatuses.includes(data.status)) {

            errors.push(
                `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`
            );
        }
    }


    // --------------------------------------------------
    // CONDITION
    // --------------------------------------------------

    if (data.condition) {

        if (!allowedConditions.includes(data.condition)) {

            errors.push(
                `Invalid condition. Allowed values: ${allowedConditions.join(", ")}`
            );
        }
    }


    // --------------------------------------------------
    // PURCHASE COST
    // --------------------------------------------------

    if (
        !isValidNonNegativeNumber(
            data.purchaseCost
        )
    ) {

        errors.push(
            "purchaseCost must be a valid non-negative number"
        );
    }


    // --------------------------------------------------
    // CURRENT VALUE
    // --------------------------------------------------

    if (
        !isValidNonNegativeNumber(
            data.currentValue
        )
    ) {

        errors.push(
            "currentValue must be a valid non-negative number"
        );
    }


    // --------------------------------------------------
    // DEPRECIATION VALUE
    // --------------------------------------------------

    if (
        !isValidNonNegativeNumber(
            data.depreciationValue
        )
    ) {

        errors.push(
            "depreciationValue must be a valid non-negative number"
        );
    }


    // --------------------------------------------------
    // PURCHASE DATE
    // --------------------------------------------------

    if (
        !isValidDate(
            data.purchaseDate
        )
    ) {

        errors.push(
            "purchaseDate must be a valid date"
        );
    }


    // --------------------------------------------------
    // COMMISSIONED DATE
    // --------------------------------------------------

    if (
        !isValidDate(
            data.commissionedDate
        )
    ) {

        errors.push(
            "commissionedDate must be a valid date"
        );
    }


    // --------------------------------------------------
    // RETIREMENT DATE
    // --------------------------------------------------

    if (
        !isValidDate(
            data.retirementDate
        )
    ) {

        errors.push(
            "retirementDate must be a valid date"
        );
    }


    return errors;
};


// ======================================================
// UPDATE ASSET VALIDATION
// ======================================================

const validateUpdateAsset = (data) => {

    const errors = [];


    // --------------------------------------------------
    // ASSET CODE
    // --------------------------------------------------

    if (
        data.assetCode !== undefined &&
        typeof data.assetCode !== "string"
    ) {

        errors.push(
            "assetCode must be a string"
        );
    }


    // --------------------------------------------------
    // ASSET NAME
    // --------------------------------------------------

    if (
        data.assetName !== undefined &&
        typeof data.assetName !== "string"
    ) {

        errors.push(
            "assetName must be a string"
        );
    }


    // --------------------------------------------------
    // ASSET TYPE
    // --------------------------------------------------

    if (
        data.assetType !== undefined &&
        typeof data.assetType !== "string"
    ) {

        errors.push(
            "assetType must be a string"
        );
    }


    // --------------------------------------------------
    // CATEGORY
    // --------------------------------------------------

    if (data.categoryId) {

        if (!isValidUUID(data.categoryId)) {

            errors.push(
                "categoryId must be a valid UUID"
            );
        }
    }


    // --------------------------------------------------
    // VENDOR
    // --------------------------------------------------

    if (data.vendorId) {

        if (!isValidUUID(data.vendorId)) {

            errors.push(
                "vendorId must be a valid UUID"
            );
        }
    }


    // --------------------------------------------------
    // TOWER
    // --------------------------------------------------

    if (data.towerId) {

        if (!isValidUUID(data.towerId)) {

            errors.push(
                "towerId must be a valid UUID"
            );
        }
    }


    // --------------------------------------------------
    // FLOOR
    // --------------------------------------------------

    if (data.floorId) {

        if (!isValidUUID(data.floorId)) {

            errors.push(
                "floorId must be a valid UUID"
            );
        }
    }


    // --------------------------------------------------
    // UNIT
    // --------------------------------------------------

    if (data.unitId) {

        if (!isValidUUID(data.unitId)) {

            errors.push(
                "unitId must be a valid UUID"
            );
        }
    }


    // --------------------------------------------------
    // STATUS
    // --------------------------------------------------

    if (data.status) {

        if (!allowedStatuses.includes(data.status)) {

            errors.push(
                `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`
            );
        }
    }


    // --------------------------------------------------
    // CONDITION
    // --------------------------------------------------

    if (data.condition) {

        if (!allowedConditions.includes(data.condition)) {

            errors.push(
                `Invalid condition. Allowed values: ${allowedConditions.join(", ")}`
            );
        }
    }


    // --------------------------------------------------
    // PURCHASE COST
    // --------------------------------------------------

    if (
        !isValidNonNegativeNumber(
            data.purchaseCost
        )
    ) {

        errors.push(
            "purchaseCost must be a valid non-negative number"
        );
    }


    // --------------------------------------------------
    // CURRENT VALUE
    // --------------------------------------------------

    if (
        !isValidNonNegativeNumber(
            data.currentValue
        )
    ) {

        errors.push(
            "currentValue must be a valid non-negative number"
        );
    }


    // --------------------------------------------------
    // DEPRECIATION VALUE
    // --------------------------------------------------

    if (
        !isValidNonNegativeNumber(
            data.depreciationValue
        )
    ) {

        errors.push(
            "depreciationValue must be a valid non-negative number"
        );
    }


    // --------------------------------------------------
    // PURCHASE DATE
    // --------------------------------------------------

    if (
        !isValidDate(
            data.purchaseDate
        )
    ) {

        errors.push(
            "purchaseDate must be a valid date"
        );
    }


    // --------------------------------------------------
    // COMMISSIONED DATE
    // --------------------------------------------------

    if (
        !isValidDate(
            data.commissionedDate
        )
    ) {

        errors.push(
            "commissionedDate must be a valid date"
        );
    }


    // --------------------------------------------------
    // RETIREMENT DATE
    // --------------------------------------------------

    if (
        !isValidDate(
            data.retirementDate
        )
    ) {

        errors.push(
            "retirementDate must be a valid date"
        );
    }


    return errors;
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {

    validateCreateAsset,

    validateUpdateAsset,

    allowedStatuses,

    allowedConditions

};
