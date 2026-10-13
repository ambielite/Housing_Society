const VALID_PROPERTY_TYPES = [
    "RESIDENTIAL",
    "COMMERCIAL"
];


const VALID_STATUSES = [
    "VACANT",
    "OCCUPIED",
    "UNDER_MOVE_IN",
    "UNDER_MOVE_OUT",
    "INACTIVE"
];


// Create Unit
const validateCreateUnit = (
    req,
    res,
    next
) => {

    const {
        floorId,
        unitNumber,
        bhk,
        carpetArea,
        builtUpArea,
        propertyType,
        status,
        areaEffectiveFrom
    } = req.body;


    if (!floorId) {

        return res.status(400).json({
            success: false,
            message: "Floor ID is required"
        });

    }


    if (
        !unitNumber ||
        unitNumber.trim() === ""
    ) {

        return res.status(400).json({
            success: false,
            message: "Unit number is required"
        });

    }


    if (unitNumber.length > 50) {

        return res.status(400).json({
            success: false,
            message: "Unit number cannot exceed 50 characters"
        });

    }


    if (
        carpetArea !== undefined &&
        carpetArea !== null &&
        Number(carpetArea) < 0
    ) {

        return res.status(400).json({
            success: false,
            message: "Carpet area cannot be negative"
        });

    }


    if (
        builtUpArea !== undefined &&
        builtUpArea !== null &&
        Number(builtUpArea) < 0
    ) {

        return res.status(400).json({
            success: false,
            message: "Built-up area cannot be negative"
        });

    }


    if (
        propertyType !== undefined &&
        !VALID_PROPERTY_TYPES.includes(
            propertyType
        )
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid property type"
        });

    }


    if (
        status !== undefined &&
        !VALID_STATUSES.includes(status)
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid unit status"
        });

    }


    if (
        areaEffectiveFrom !== undefined &&
        areaEffectiveFrom !== null &&
        !/^\d{4}-\d{2}-\d{2}$/.test(
            areaEffectiveFrom
        )
    ) {

        return res.status(400).json({
            success: false,
            message: "areaEffectiveFrom must be in YYYY-MM-DD format"
        });

    }


    next();
};


// Update Unit
const validateUpdateUnit = (
    req,
    res,
    next
) => {

    const {
        unitNumber,
        bhk,
        carpetArea,
        builtUpArea,
        propertyType,
        status,
        areaEffectiveFrom
    } = req.body;


    if (
        unitNumber !== undefined &&
        (
            !unitNumber ||
            unitNumber.trim() === ""
        )
    ) {

        return res.status(400).json({
            success: false,
            message: "Unit number cannot be empty"
        });

    }


    if (
        carpetArea !== undefined &&
        (
            carpetArea === null ||
            Number(carpetArea) < 0
        )
    ) {

        return res.status(400).json({
            success: false,
            message: "Carpet area cannot be negative"
        });

    }


    if (
        builtUpArea !== undefined &&
        (
            builtUpArea === null ||
            Number(builtUpArea) < 0
        )
    ) {

        return res.status(400).json({
            success: false,
            message: "Built-up area cannot be negative"
        });

    }


    if (
        propertyType !== undefined &&
        !VALID_PROPERTY_TYPES.includes(
            propertyType
        )
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid property type"
        });

    }


    if (
        status !== undefined &&
        !VALID_STATUSES.includes(status)
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid unit status"
        });

    }


    if (
        areaEffectiveFrom !== undefined &&
        areaEffectiveFrom !== null &&
        !/^\d{4}-\d{2}-\d{2}$/.test(
            areaEffectiveFrom
        )
    ) {

        return res.status(400).json({
            success: false,
            message: "areaEffectiveFrom must be in YYYY-MM-DD format"
        });

    }


    next();
};


// Validate Unit ID
const validateUnitId = (
    req,
    res,
    next
) => {

    if (!req.params.id) {

        return res.status(400).json({
            success: false,
            message: "Unit ID is required"
        });

    }

    next();
};


module.exports = {
    validateCreateUnit,
    validateUpdateUnit,
    validateUnitId
};