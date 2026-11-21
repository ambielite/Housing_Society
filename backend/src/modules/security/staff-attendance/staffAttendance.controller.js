const StaffAttendanceService =
    require("./staffAttendance.service");
const { query } = require("../../../config/db");

// Guard tokens are bound to one verified employee code. Admin attendance
// actions remain available through the existing attendance workflow.
const resolveGuardStaffAndCheckShift = async (req, requestedStaffId) => {
    const employeeCode = req.user?.guardEmployeeCode;
    if (!employeeCode) return { staffId: requestedStaffId, attendanceDate: null };

    const staffResult = await query(
        `SELECT id
           FROM staff
          WHERE society_id = $1
            AND upper(employee_code) = upper($2)
            AND staff_type = 'SECURITY_GUARD'
            AND status = 'ACTIVE'
          LIMIT 1`,
        [req.user.societyId, employeeCode]
    );
    const staff = staffResult.rows[0];
    if (!staff || staff.id !== requestedStaffId) {
        const error = new Error("You can only mark attendance for your own guard profile");
        error.statusCode = 403;
        throw error;
    }

    const shiftResult = await query(
        `SELECT r.roster_date
           FROM staff_rosters r
           JOIN shifts s ON s.id = r.shift_id AND s.society_id = r.society_id
          WHERE r.staff_id = $1
            AND r.society_id = $2
            AND r.status IN ('SCHEDULED', 'CONFIRMED')
            AND s.status = 'ACTIVE'
            AND r.roster_date BETWEEN
                ((now() AT TIME ZONE 'Asia/Kolkata')::date - 1)
                AND (now() AT TIME ZONE 'Asia/Kolkata')::date
            AND now() >= ((r.roster_date + s.start_time) AT TIME ZONE 'Asia/Kolkata')
            AND now() < ((r.roster_date + s.end_time +
                CASE WHEN s.is_overnight OR s.end_time <= s.start_time
                     THEN interval '1 day' ELSE interval '0 day' END)
                AT TIME ZONE 'Asia/Kolkata')
          LIMIT 1`,
        [staff.id, req.user.societyId]
    );
    if (!shiftResult.rowCount) {
        const error = new Error("Attendance is available only during your assigned shift");
        error.statusCode = 403;
        throw error;
    }
    return { staffId: staff.id, attendanceDate: shiftResult.rows[0].roster_date };
};


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

        const guardAttendance = await resolveGuardStaffAndCheckShift(req, staffId);
        const result =
            await StaffAttendanceService
                .checkIn(
                    guardAttendance.staffId,
                    guardAttendance.attendanceDate || attendanceDate,
                    req.user?.guardEmployeeCode ? undefined : checkInTime
                );

        return res.status(200).json({
            success: true,
            message:
                "Staff checked in successfully",
            data: result
        });

    } catch (error) {

        return res.status(error.statusCode || 400).json({
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

        const guardAttendance = await resolveGuardStaffAndCheckShift(req, staffId);
        const result =
            await StaffAttendanceService
                .checkOut(
                    guardAttendance.staffId,
                    guardAttendance.attendanceDate || attendanceDate,
                    req.user?.guardEmployeeCode ? undefined : checkOutTime
                );

        return res.status(200).json({
            success: true,
            message:
                "Staff checked out successfully",
            data: result
        });

    } catch (error) {

        return res.status(error.statusCode || 400).json({
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
