const { validate: isUUID } = require("uuid");

const isValidDateOnly = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const validatePendingAmountQuery = (req, res, next) => {
    const { societyId, unitId, residentId, requestedMoveOutDate } = req.query;
    if (!societyId || !isUUID(societyId)) {
        return res.status(400).json({ success: false, message: "Valid Society ID is required" });
    }
    if (!unitId || !isUUID(unitId)) {
        return res.status(400).json({ success: false, message: "Valid Unit ID is required" });
    }
    if (!residentId || !isUUID(residentId)) {
        return res.status(400).json({ success: false, message: "Valid Resident ID is required" });
    }
    if (!isValidDateOnly(requestedMoveOutDate)) {
        return res.status(400).json({ success: false, message: "Requested Move-Out Date must be a valid date" });
    }
    next();
};

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

    if (!isValidDateOnly(requestedMoveOutDate)) {
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
    validatePendingAmountQuery,
    validateCreateMoveOut,
    validateMoveOutId,
    validateOutstandingDues,
    validateApproval,
    validateRejection
};
