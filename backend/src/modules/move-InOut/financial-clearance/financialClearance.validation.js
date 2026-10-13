const { validate: isUUID } = require("uuid");


const validateId = (req, res, next) => {

    const { id } = req.params;

    if (!isUUID(id)) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid financial clearance ID"
        });
    }

    next();
};


const validateLifecycleId = (req, res, next) => {

    const { lifecycleId } = req.params;

    if (!isUUID(lifecycleId)) {

        return res.status(400).json({
            success: false,
            message: "Invalid lifecycleId"
        });
    }

    next();
};


const validateCreate = (req, res, next) => {

    const {
        societyId,
        unitId,
        residentId,
        lifecycleId
    } = req.body;


    if (!societyId) {

        return res.status(400).json({
            success: false,
            message: "societyId is required"
        });
    }


    if (!isUUID(societyId)) {

        return res.status(400).json({
            success: false,
            message: "Invalid societyId UUID"
        });
    }


    if (!unitId) {

        return res.status(400).json({
            success: false,
            message: "unitId is required"
        });
    }


    if (!isUUID(unitId)) {

        return res.status(400).json({
            success: false,
            message: "Invalid unitId UUID"
        });
    }


    if (!residentId) {

        return res.status(400).json({
            success: false,
            message: "residentId is required"
        });
    }


    if (!isUUID(residentId)) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid residentId UUID"
        });
    }


    if (!lifecycleId) {

        return res.status(400).json({
            success: false,
            message:
                "lifecycleId is required"
        });
    }


    if (!isUUID(lifecycleId)) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid lifecycleId UUID"
        });
    }


    if (
        req.body.outstandingAmount !== undefined &&
        (
            isNaN(Number(req.body.outstandingAmount)) ||
            Number(req.body.outstandingAmount) < 0
        )
    ) {

        return res.status(400).json({
            success: false,
            message:
                "outstandingAmount must be a valid non-negative number"
        });
    }


    next();
};


const validateClear = (req, res, next) => {

    const { clearedBy } = req.body;


    if (!clearedBy) {

        return res.status(400).json({
            success: false,
            message:
                "clearedBy is required"
        });
    }


    if (!isUUID(clearedBy)) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid clearedBy UUID"
        });
    }


    next();
};


const validateHold = (req, res, next) => {

    const { remarks } = req.body;


    if (!remarks || remarks.trim() === "") {

        return res.status(400).json({
            success: false,
            message:
                "Remarks are required when putting clearance on hold"
        });
    }


    next();
};


const validateOutstandingAmount = (
    req,
    res,
    next
) => {

    const { outstandingAmount } = req.body;


    if (outstandingAmount === undefined) {

        return res.status(400).json({
            success: false,
            message:
                "outstandingAmount is required"
        });
    }


    if (
        isNaN(Number(outstandingAmount)) ||
        Number(outstandingAmount) < 0
    ) {

        return res.status(400).json({
            success: false,
            message:
                "outstandingAmount must be a valid non-negative number"
        });
    }


    next();
};


module.exports = {

    validateId,

    validateLifecycleId,

    validateCreate,

    validateClear,

    validateHold,

    validateOutstandingAmount
};