const { validate: isUUID } = require("uuid");


const validateCreateAccess = (
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
        accessType
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
        ![
            "RESIDENT",
            "OWNER",
            "TENANT",
            "VEHICLE",
            "GATE",
            "COMMON_AREA"
        ].includes(accessType)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid accessType"
        });
    }


    next();
};


const validateAccessId = (
    req,
    res,
    next
) => {

    if (!isUUID(req.params.id)) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid access assignment ID"
        });
    }

    next();
};


const validateUnitId = (
    req,
    res,
    next
) => {

    if (!isUUID(req.params.unitId)) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid unit ID"
        });
    }

    next();
};


const validateResidentId = (
    req,
    res,
    next
) => {

    if (!isUUID(req.params.residentId)) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid resident ID"
        });
    }

    next();
};


const validateLifecycle = (
    req,
    res,
    next
) => {

    if (
        !["MOVE_IN", "MOVE_OUT"]
            .includes(
                req.params.lifecycleType
            )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid lifecycle type"
        });
    }


    if (
        !isUUID(req.params.lifecycleId)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid lifecycle ID"
        });
    }


    next();
};


const validateRevoke = (
    req,
    res,
    next
) => {

    if (
        !req.body.revokedBy ||
        !isUUID(req.body.revokedBy)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Valid revokedBy UUID is required"
        });
    }

    next();
};


const validateReactivate = (
    req,
    res,
    next
) => {

    if (
        !req.body.activatedBy ||
        !isUUID(req.body.activatedBy)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Valid activatedBy UUID is required"
        });
    }

    next();
};


module.exports = {
    validateCreateAccess,
    validateAccessId,
    validateUnitId,
    validateResidentId,
    validateLifecycle,
    validateRevoke,
    validateReactivate
};