const { validate: isUUID } = require("uuid");

const validateCreateMoveOut = (
    req,
    res,
    next
) => {
    const {
        societyId,
        unitId,
        residentId,
        requestedMoveOutDate
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

    if (!requestedMoveOutDate) {
        return res.status(400).json({
            success: false,
            message: "Requested move-out date is required"
        });
    }

    const date = new Date(
        requestedMoveOutDate
    );

    if (Number.isNaN(date.getTime())) {
        return res.status(400).json({
            success: false,
            message: "Invalid move-out date"
        });
    }

    next();
};

const validateMoveOutId = (
    req,
    res,
    next
) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            success: false,
            message: "Move-out ID is required"
        });
    }

    if (!isUUID(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid Move-out ID"
        });
    }

    next();
};

const validateOutstandingDues = (
    req,
    res,
    next
) => {
    const { outstandingAmount } = req.body;

    if (
        outstandingAmount === undefined ||
        outstandingAmount === null
    ) {
        return res.status(400).json({
            success: false,
            message: "Outstanding amount is required"
        });
    }

    const amount = Number(
        outstandingAmount
    );

    if (
        Number.isNaN(amount) ||
        amount < 0
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Outstanding amount must be a valid non-negative number"
        });
    }

    next();
};

const validateApproval = (
    req,
    res,
    next
) => {
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

const validateRejection = (
    req,
    res,
    next
) => {
    const { remarks } = req.body;

    if (
        !remarks ||
        remarks.trim() === ""
    ) {
        return res.status(400).json({
            success: false,
            message: "Rejection remarks are required"
        });
    }

    next();
};

module.exports = {
    validateCreateMoveOut,
    validateMoveOutId,
    validateOutstandingDues,
    validateApproval,
    validateRejection
};