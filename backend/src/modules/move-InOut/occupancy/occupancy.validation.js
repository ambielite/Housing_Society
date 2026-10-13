const { validate: isUUID } = require("uuid");

const validateCreateOccupancy = (
    req,
    res,
    next
) => {
    const {
        societyId,
        unitId,
        residentId,
        occupancyType,
        startDate
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
            message:
                "Occupancy type must be OWNER or TENANT"
        });
    }

    if (!startDate) {
        return res.status(400).json({
            success: false,
            message: "Start date is required"
        });
    }

    if (
        Number.isNaN(
            new Date(startDate).getTime()
        )
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid start date"
        });
    }

    next();
};

const validateOccupancyId = (
    req,
    res,
    next
) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            success: false,
            message: "Occupancy ID is required"
        });
    }

    if (!isUUID(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid Occupancy ID"
        });
    }

    next();
};

const validateUnitId = (
    req,
    res,
    next
) => {
    const { unitId } = req.params;

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

    next();
};

const validateResidentId = (
    req,
    res,
    next
) => {
    const { residentId } = req.params;

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

    next();
};

const validateCloseOccupancy = (
    req,
    res,
    next
) => {
    const { endDate } = req.body;

    if (!endDate) {
        return res.status(400).json({
            success: false,
            message: "End date is required"
        });
    }

    if (
        Number.isNaN(
            new Date(endDate).getTime()
        )
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid end date"
        });
    }

    next();
};

const validateTransferOccupancy = (
    req,
    res,
    next
) => {
    const {
        societyId,
        unitId,
        newResidentId,
        newOccupancyType,
        transferDate
    } = req.body;

    if (!societyId || !isUUID(societyId)) {
        return res.status(400).json({
            success: false,
            message: "Valid Society ID is required"
        });
    }

    if (!unitId || !isUUID(unitId)) {
        return res.status(400).json({
            success: false,
            message: "Valid Unit ID is required"
        });
    }

    if (
        !newResidentId ||
        !isUUID(newResidentId)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Valid new Resident ID is required"
        });
    }

    if (
        !["OWNER", "TENANT"].includes(
            newOccupancyType
        )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Occupancy type must be OWNER or TENANT"
        });
    }

    if (!transferDate) {
        return res.status(400).json({
            success: false,
            message: "Transfer date is required"
        });
    }

    next();
};

module.exports = {
    validateCreateOccupancy,
    validateOccupancyId,
    validateUnitId,
    validateResidentId,
    validateCloseOccupancy,
    validateTransferOccupancy
};