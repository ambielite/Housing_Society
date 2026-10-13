const { validate: isUUID } = require("uuid");


const validateId = (req, res, next) => {

    const { id } = req.params;

    if (!isUUID(id)) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid lifecycle audit ID"
        });
    }

    next();
};


const validateCreate = (req, res, next) => {

    const {
        lifecycleType,
        lifecycleId,
        action,
        performedBy
    } = req.body;


    if (!lifecycleType) {

        return res.status(400).json({
            success: false,
            message:
                "lifecycleType is required"
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


    if (!action) {

        return res.status(400).json({
            success: false,
            message:
                "action is required"
        });
    }


    if (action.length > 100) {

        return res.status(400).json({
            success: false,
            message:
                "action cannot exceed 100 characters"
        });
    }


    if (
        performedBy &&
        !isUUID(performedBy)
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid performedBy UUID"
        });
    }


    next();
};


const validateLifecycle = (
    req,
    res,
    next
) => {

    const {
        lifecycleType,
        lifecycleId
    } = req.params;


    if (
        !["MOVE_IN", "MOVE_OUT"]
            .includes(lifecycleType)
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid lifecycleType"
        });
    }


    if (!isUUID(lifecycleId)) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid lifecycleId UUID"
        });
    }


    next();
};


const validatePerformer = (
    req,
    res,
    next
) => {

    const { performedBy } = req.params;


    if (!isUUID(performedBy)) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid performedBy UUID"
        });
    }


    next();
};


const validateAction = (
    req,
    res,
    next
) => {

    const { action } = req.params;


    if (!action || action.length > 100) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid action"
        });
    }


    next();
};


module.exports = {
    validateId,
    validateCreate,
    validateLifecycle,
    validatePerformer,
    validateAction
};