const StaffAttendanceService =
    require("./staffAttendance.service");


const createAttendance = async (
    req,
    res
) => {

    try {

        const result =
            await StaffAttendanceService
                .createAttendance(
                    req.body
                );

        return res.status(201).json({
            success: true,
            message:
                "Attendance created successfully",
            data: result
        });

    } catch (error) {

        console.error(
            "Create attendance error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAllAttendance = async (
    req,
    res
) => {

    try {

        const filters = {};

        if (req.query.staffId) {
            filters.staffId =
                req.query.staffId;
        }

        if (req.query.attendanceDate) {
            filters.attendanceDate =
                req.query.attendanceDate;
        }

        if (req.query.status) {
            filters.status =
                req.query.status;
        }

        const result =
            await StaffAttendanceService
                .getAllAttendance(
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


const getAttendanceById = async (
    req,
    res
) => {

    try {

        const result =
            await StaffAttendanceService
                .getAttendanceById(
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


const getAttendanceByStaff = async (
    req,
    res
) => {

    try {

        const result =
            await StaffAttendanceService
                .getAttendanceByStaff(
                    req.params.staffId
                );

        return res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const checkIn = async (
    req,
    res
) => {

    try {

        const {
            staffId,
            attendanceDate,
            checkInTime
        } = req.body;

        if (!staffId || !attendanceDate) {
            return res.status(400).json({
                success: false,
                message:
                    "staffId and attendanceDate are required"
            });
        }

        const result =
            await StaffAttendanceService
                .checkIn(
                    staffId,
                    attendanceDate,
                    checkInTime
                );

        return res.status(200).json({
            success: true,
            message:
                "Staff checked in successfully",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const checkOut = async (
    req,
    res
) => {

    try {

        const {
            staffId,
            attendanceDate,
            checkOutTime
        } = req.body;

        if (!staffId || !attendanceDate) {
            return res.status(400).json({
                success: false,
                message:
                    "staffId and attendanceDate are required"
            });
        }

        const result =
            await StaffAttendanceService
                .checkOut(
                    staffId,
                    attendanceDate,
                    checkOutTime
                );

        return res.status(200).json({
            success: true,
            message:
                "Staff checked out successfully",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const markAbsent = async (
    req,
    res
) => {

    try {

        const {
            staffId,
            attendanceDate,
            remarks
        } = req.body;

        const result =
            await StaffAttendanceService
                .markAbsent(
                    staffId,
                    attendanceDate,
                    remarks
                );

        return res.status(201).json({
            success: true,
            message:
                "Staff marked absent",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const markLeave = async (
    req,
    res
) => {

    try {

        const {
            staffId,
            attendanceDate,
            remarks
        } = req.body;

        const result =
            await StaffAttendanceService
                .markLeave(
                    staffId,
                    attendanceDate,
                    remarks
                );

        return res.status(201).json({
            success: true,
            message:
                "Staff marked on leave",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const updateAttendance = async (
    req,
    res
) => {

    try {

        const result =
            await StaffAttendanceService
                .updateAttendance(
                    req.params.id,
                    req.body
                );

        return res.status(200).json({
            success: true,
            message:
                "Attendance updated successfully",
            data: result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteAttendance = async (
    req,
    res
) => {

    try {

        const result =
            await StaffAttendanceService
                .deleteAttendance(
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
    createAttendance,
    getAllAttendance,
    getAttendanceById,
    getAttendanceByStaff,
    checkIn,
    checkOut,
    markAbsent,
    markLeave,
    updateAttendance,
    deleteAttendance
};