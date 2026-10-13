const ShiftService =
    require("./shift.service");


const createShift = async (
    req,
    res
) => {

    try {

        const result =
            await ShiftService.createShift(
                req.body
            );

        return res.status(201).json({
            success: true,
            message:
                "Shift created successfully",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAllShifts = async (
    req,
    res
) => {

    try {

        const filters = {};

        if (req.query.societyId) {
            filters.societyId =
                req.query.societyId;
        }

        if (req.query.status) {
            filters.status =
                req.query.status;
        }

        if (req.query.shiftType) {
            filters.shiftType =
                req.query.shiftType;
        }

        const result =
            await ShiftService.getAllShifts(
                filters
            );

        return res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getShiftById = async (
    req,
    res
) => {

    try {

        const result =
            await ShiftService.getShiftById(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const updateShift = async (
    req,
    res
) => {

    try {

        const result =
            await ShiftService.updateShift(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message:
                "Shift updated successfully",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const activateShift = async (
    req,
    res
) => {

    try {

        const result =
            await ShiftService.activateShift(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message:
                "Shift activated successfully",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deactivateShift = async (
    req,
    res
) => {

    try {

        const result =
            await ShiftService.deactivateShift(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message:
                "Shift deactivated successfully",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteShift = async (
    req,
    res
) => {

    try {

        const result =
            await ShiftService.deleteShift(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createShift,
    getAllShifts,
    getShiftById,
    updateShift,
    activateShift,
    deactivateShift,
    deleteShift
};