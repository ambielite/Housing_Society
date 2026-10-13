const { validate: isUUID } = require("uuid");

const validateCreateMoveIn = (req, res, next) => {
    const {
        societyId,
        unitId,
        residentId,
        occupancyType,
        requestedMoveInDate
    } = req.body;

    if (!societyId) {
        return res.status(400).json({
            success: false,
            message: "Society ID is required"
        });
    }

    if (!isUUID(societyId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid Society ID"
        });
    }

    if (!unitId) {
        return res.status(400).json({
            success: false,
            message: "Unit ID is required"
        });
    }

    if (!isUUID(unitId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid Unit ID"
        });
    }

    if (!residentId) {
        return res.status(400).json({
            success: false,
            message: "Resident ID is required"
        });
    }

    if (!isUUID(residentId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid Resident ID"
        });
    }

    if (
        !["OWNER", "TENANT"].includes(
            occupancyType
        )
    ) {
        return res.status(400).json({
            success: false,
            message: "Occupancy type must be OWNER or TENANT"
        });
    }

    if (!requestedMoveInDate) {
        return res.status(400).json({
            success: false,
            message: "Requested move-in date is required"
        });
    }

    const date = new Date(requestedMoveInDate);

    if (Number.isNaN(date.getTime())) {
        return res.status(400).json({
            success: false,
            message: "Invalid move-in date"
        });
    }

    next();
};

const validateMoveInId = (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            success: false,
            message: "Move-in ID is required"
        });
    }

    if (!isUUID(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid Move-in ID"
        });
    }

    next();
};

const validateUpdateMoveIn = (req, res, next) => {
    const { agreementId } = req.body;

    if (agreementId && !isUUID(agreementId)) {
        return res.status(400).json({
            success: false,
            message: "Agreement must be selected from the agreement records"
        });
    }

    next();
};

const validateApproval = (req, res, next) => {
    const { approvedBy } = req.body;

    if (!approvedBy) {
        return res.status(400).json({
            success: false,
            message: "Approved by user ID is required"
        });
    }

    if (!isUUID(approvedBy)) {
        return res.status(400).json({
            success: false,
            message: "Invalid approvedBy user ID"
        });
    }

    next();
};

const validateRejection = (req, res, next) => {
    const { remarks } = req.body;

    if (!remarks || remarks.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Rejection remarks are required"
        });
    }

    next();
};

module.exports = {
    validateCreateMoveIn,
    validateMoveInId,
    validateUpdateMoveIn,
    validateApproval,
    validateRejection
};
