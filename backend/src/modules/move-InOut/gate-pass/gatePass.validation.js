const { validate: isUUID } = require("uuid");


const validateCreateGatePass = (
    req,
    res,
    next
) => {

    const {
        societyId,
        unitId,
        residentId,
        lifecycleType,
        lifecycleId,
        passType,
        validFrom,
        validUntil
    } = req.body;


    if (
        !societyId ||
        !isUUID(societyId)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Valid societyId is required"
        });
    }


    if (
        !unitId ||
        !isUUID(unitId)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Valid unitId is required"
        });
    }


    if (
        !residentId ||
        !isUUID(residentId)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Valid residentId is required"
        });
    }


    if (
        !["MOVE_IN", "MOVE_OUT"]
            .includes(lifecycleType)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "lifecycleType must be MOVE_IN or MOVE_OUT"
        });
    }


    if (
        !lifecycleId ||
        !isUUID(lifecycleId)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Valid lifecycleId is required"
        });
    }


    if (
        !["MOVE_IN", "MOVE_OUT"]
            .includes(passType)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "passType must be MOVE_IN or MOVE_OUT"
        });
    }


    if (!validFrom) {
        return res.status(400).json({
            success: false,
            message:
                "validFrom is required"
        });
    }


    if (!validUntil) {
        return res.status(400).json({
            success: false,
            message:
                "validUntil is required"
        });
    }


    if (
        new Date(validUntil) <=
        new Date(validFrom)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "validUntil must be after validFrom"
        });
    }


    next();
};


const validateGatePassId = (
    req,
    res,
    next
) => {

    if (!isUUID(req.params.id)) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid gate pass ID"
        });
    }

    next();
};


const validatePassCode = (
    req,
    res,
    next
) => {

    if (
        !req.params.passCode ||
        !req.params.passCode.trim()
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Pass code is required"
        });
    }

    next();
};


const validateVerification = (
    req,
    res,
    next
) => {

    if (
        !req.body.verifiedBy ||
        !isUUID(req.body.verifiedBy)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Valid verifiedBy UUID is required"
        });
    }

    next();
};


module.exports = {
    validateCreateGatePass,
    validateGatePassId,
    validatePassCode,
    validateVerification
};