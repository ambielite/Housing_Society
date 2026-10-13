const { validate: isUUID } = require("uuid");


const validateApprovalId = (req, res, next) => {

    const { id } = req.params;

    if (!isUUID(id)) {

        return res.status(400).json({
            success: false,
            message: "Invalid approval ID"
        });
    }

    next();
};


const validateCreateApproval = (req, res, next) => {

    const {
        lifecycleType,
        lifecycleId,
        approvalType,
        assignedTo
    } = req.body;


    if (!lifecycleType) {

        return res.status(400).json({
            success: false,
            message: "lifecycleType is required"
        });
    }


    if (!["MOVE_IN", "MOVE_OUT"].includes(lifecycleType)) {

        return res.status(400).json({
            success: false,
            message:
                "lifecycleType must be MOVE_IN or MOVE_OUT"
        });
    }


    if (!lifecycleId) {

        return res.status(400).json({
            success: false,
            message: "lifecycleId is required"
        });
    }


    if (!isUUID(lifecycleId)) {

        return res.status(400).json({
            success: false,
            message: "Invalid lifecycleId"
        });
    }


    if (!approvalType) {

        return res.status(400).json({
            success: false,
            message: "approvalType is required"
        });
    }


    const allowedApprovalTypes = [
        "DOCUMENT_VERIFICATION",
        "MOVE_IN_APPROVAL",
        "MOVE_OUT_APPROVAL",
        "FINANCIAL_CLEARANCE"
    ];


    if (!allowedApprovalTypes.includes(approvalType)) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid approvalType"
        });
    }


    if (assignedTo && !isUUID(assignedTo)) {

        return res.status(400).json({
            success: false,
            message: "Invalid assignedTo UUID"
        });
    }


    next();
};


const validateAction = (req, res, next) => {

    const { actionBy } = req.body;

    if (!actionBy) {

        return res.status(400).json({
            success: false,
            message: "actionBy is required"
        });
    }


    if (!isUUID(actionBy)) {

        return res.status(400).json({
            success: false,
            message: "Invalid actionBy UUID"
        });
    }


    next();
};


const validateRejection = (req, res, next) => {

    const { actionBy, remarks } = req.body;


    if (!actionBy) {

        return res.status(400).json({
            success: false,
            message: "actionBy is required"
        });
    }


    if (!isUUID(actionBy)) {

        return res.status(400).json({
            success: false,
            message: "Invalid actionBy UUID"
        });
    }


    if (!remarks || remarks.trim() === "") {

        return res.status(400).json({
            success: false,
            message:
                "Remarks are required for rejection"
        });
    }


    next();
};


const validateLifecycle = (req, res, next) => {

    const { lifecycleType, lifecycleId } = req.params;


    if (!["MOVE_IN", "MOVE_OUT"].includes(lifecycleType)) {

        return res.status(400).json({
            success: false,
            message: "Invalid lifecycleType"
        });
    }


    if (!isUUID(lifecycleId)) {

        return res.status(400).json({
            success: false,
            message: "Invalid lifecycleId"
        });
    }


    next();
};


module.exports = {
    validateApprovalId,
    validateCreateApproval,
    validateAction,
    validateRejection,
    validateLifecycle
};