const { validate: isUUID } = require("uuid");


const validateId = (req, res, next) => {

    if (!isUUID(req.params.id)) {

        return res.status(400).json({
            success: false,
            message: "Invalid agreement ID"
        });

    }

    next();
};


const validateUUIDParam = (paramName, message) => {

    return (req, res, next) => {

        if (!isUUID(req.params[paramName])) {

            return res.status(400).json({
                success: false,
                message
            });

        }

        next();
    };
};


const validateCreate = (req, res, next) => {

    const {
        societyId,
        unitId,
        agreementReference,
        agreementType,
        startDate,
        expiryDate
    } = req.body;


    if (!societyId || !isUUID(societyId)) {

        return res.status(400).json({
            success: false,
            message: "Valid societyId is required"
        });

    }


    if (!unitId || !isUUID(unitId)) {

        return res.status(400).json({
            success: false,
            message: "Valid unitId is required"
        });

    }


    if (!agreementReference) {

        return res.status(400).json({
            success: false,
            message: "agreementReference is required"
        });

    }


    if (!agreementType) {

        return res.status(400).json({
            success: false,
            message: "agreementType is required"
        });

    }


    const allowedTypes = [
        "RENTAL",
        "LEASE",
        "TENANCY",
        "LEAVE_AND_LICENSE",
        "OTHER"
    ];


    if (!allowedTypes.includes(agreementType)) {

        return res.status(400).json({
            success: false,
            message: "Invalid agreementType"
        });

    }


    if (!startDate) {

        return res.status(400).json({
            success: false,
            message: "startDate is required"
        });

    }


    if (!expiryDate) {

        return res.status(400).json({
            success: false,
            message: "expiryDate is required"
        });

    }


    if (startDate >= expiryDate) {

        return res.status(400).json({
            success: false,
            message: "expiryDate must be after startDate"
        });

    }


    if (
        req.body.ownerId &&
        !isUUID(req.body.ownerId)
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid ownerId"
        });

    }


    if (
        req.body.tenantId &&
        !isUUID(req.body.tenantId)
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid tenantId"
        });

    }


    next();
};


const validateRemarks = (req, res, next) => {

    if (!req.body.remarks) {

        return res.status(400).json({
            success: false,
            message: "remarks is required"
        });

    }

    next();
};


module.exports = {
    validateId,
    validateUUIDParam,
    validateCreate,
    validateRemarks
};