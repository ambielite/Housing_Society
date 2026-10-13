const VALID_BILLING_CYCLES = [
    "MONTHLY",
    "QUARTERLY",
    "HALF_YEARLY",
    "YEARLY"
];


// Validate Society ID
const validateSocietyId = (
    req,
    res,
    next
) => {

    if (!req.params.societyId) {

        return res.status(400).json({
            success: false,
            message: "Society ID is required"
        });
    }

    next();
};


// Validate Settings ID
const validateSettingsId = (
    req,
    res,
    next
) => {

    if (!req.params.id) {

        return res.status(400).json({
            success: false,
            message: "Settings ID is required"
        });
    }

    next();
};


// Validate Create Settings
const validateCreateSettings = (
    req,
    res,
    next
) => {

    const {
        societyId,
        billingCycle,
        dueDate,
        penaltyRules,
        approvalHierarchy,
        visitorCategories,
        amenityRules
    } = req.body;


    // Society ID
    if (!societyId) {

        return res.status(400).json({
            success: false,
            message: "Society ID is required"
        });
    }


    // Billing Cycle
    if (
        billingCycle !== undefined &&
        !VALID_BILLING_CYCLES.includes(
            billingCycle
        )
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid billing cycle"
        });
    }


    // Due Date
    if (
        dueDate !== undefined &&
        (
            !Number.isInteger(
                Number(dueDate)
            ) ||
            Number(dueDate) < 1 ||
            Number(dueDate) > 31
        )
    ) {

        return res.status(400).json({
            success: false,
            message: "Due date must be between 1 and 31"
        });
    }


    // Penalty Rules
    if (
        penaltyRules !== undefined &&
        (
            typeof penaltyRules !== "object" ||
            Array.isArray(penaltyRules)
        )
    ) {

        return res.status(400).json({
            success: false,
            message: "Penalty rules must be an object"
        });
    }


    // Approval Hierarchy
    if (
        approvalHierarchy !== undefined &&
        !Array.isArray(approvalHierarchy)
    ) {

        return res.status(400).json({
            success: false,
            message: "Approval hierarchy must be an array"
        });
    }


    // Visitor Categories
    if (
        visitorCategories !== undefined &&
        !Array.isArray(visitorCategories)
    ) {

        return res.status(400).json({
            success: false,
            message: "Visitor categories must be an array"
        });
    }


    // Amenity Rules
    if (
        amenityRules !== undefined &&
        (
            typeof amenityRules !== "object" ||
            Array.isArray(amenityRules)
        )
    ) {

        return res.status(400).json({
            success: false,
            message: "Amenity rules must be an object"
        });
    }


    next();
};


// Validate Update Settings
const validateUpdateSettings = (
    req,
    res,
    next
) => {

    const {
        billingCycle,
        dueDate,
        penaltyRules,
        approvalHierarchy,
        visitorCategories,
        amenityRules
    } = req.body;


    if (
        billingCycle !== undefined &&
        !VALID_BILLING_CYCLES.includes(
            billingCycle
        )
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid billing cycle"
        });
    }


    if (
        dueDate !== undefined &&
        (
            !Number.isInteger(
                Number(dueDate)
            ) ||
            Number(dueDate) < 1 ||
            Number(dueDate) > 31
        )
    ) {

        return res.status(400).json({
            success: false,
            message: "Due date must be between 1 and 31"
        });
    }


    if (
        penaltyRules !== undefined &&
        (
            typeof penaltyRules !== "object" ||
            Array.isArray(penaltyRules)
        )
    ) {

        return res.status(400).json({
            success: false,
            message: "Penalty rules must be an object"
        });
    }


    if (
        approvalHierarchy !== undefined &&
        !Array.isArray(approvalHierarchy)
    ) {

        return res.status(400).json({
            success: false,
            message: "Approval hierarchy must be an array"
        });
    }


    if (
        visitorCategories !== undefined &&
        !Array.isArray(visitorCategories)
    ) {

        return res.status(400).json({
            success: false,
            message: "Visitor categories must be an array"
        });
    }


    if (
        amenityRules !== undefined &&
        (
            typeof amenityRules !== "object" ||
            Array.isArray(amenityRules)
        )
    ) {

        return res.status(400).json({
            success: false,
            message: "Amenity rules must be an object"
        });
    }


    next();
};


module.exports = {
    validateSocietyId,
    validateSettingsId,
    validateCreateSettings,
    validateUpdateSettings
};