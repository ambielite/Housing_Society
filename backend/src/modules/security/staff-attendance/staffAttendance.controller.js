const StaffAttendanceService =
    require("./staffAttendance.service");
const { query } = require("../../../config/db");

// Guard tokens are bound to one verified employee code. Admin attendance
// actions remain available through the existing attendance workflow.
const resolveGuardStaffAndCheckShift = async (
    req,
    requestedStaffId,
    { allowAfterShiftEnd = false, attendanceDate } = {}
) => {
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

    const shiftResult = allowAfterShiftEnd
        ? await query(
        `SELECT ((CAST($3 AS date) + s.end_time +
                    CASE WHEN s.is_overnight OR s.end_time <= s.start_time
                         THEN interval '1 day' ELSE interval '0 day' END)
                    AT TIME ZONE COALESCE(society.timezone, 'Asia/Kolkata')) AS scheduled_shift_end
           FROM staff_rosters r
           JOIN shifts s ON s.id = r.shift_id AND s.society_id = r.society_id
           JOIN societies society ON society.id = r.society_id
           JOIN staff_attendance attendance
             ON attendance.staff_id = r.staff_id
            AND attendance.attendance_date = CAST($3 AS date)
          WHERE r.staff_id = $1
            AND r.society_id = $2
            AND r.status IN ('SCHEDULED', 'CONFIRMED')
            AND s.status = 'ACTIVE'
            AND CAST($3 AS date) BETWEEN r.roster_date
                                     AND CASE WHEN r.roster_type = 'DAILY'
                                              THEN 'infinity'::date
                                              ELSE COALESCE(r.roster_end_date, r.roster_date)
                                         END
            AND now() >= ((CAST($3 AS date) + s.start_time)
                AT TIME ZONE COALESCE(society.timezone, 'Asia/Kolkata'))
            AND attendance.check_in_time >= ((CAST($3 AS date) + s.start_time)
                AT TIME ZONE COALESCE(society.timezone, 'Asia/Kolkata'))
            AND attendance.check_in_time < ((CAST($3 AS date) + s.end_time +
                CASE WHEN s.is_overnight OR s.end_time <= s.start_time
                     THEN interval '1 day' ELSE interval '0 day' END)
                AT TIME ZONE COALESCE(society.timezone, 'Asia/Kolkata'))
          ORDER BY scheduled_shift_end DESC
          LIMIT 1`,
        [staff.id, req.user.societyId, attendanceDate]
    )
        : await query(
        `SELECT occurrence.shift_date AS attendance_date
           FROM staff_rosters r
           JOIN shifts s ON s.id = r.shift_id AND s.society_id = r.society_id
           JOIN societies society ON society.id = r.society_id
           CROSS JOIN LATERAL (
               VALUES ((now() AT TIME ZONE COALESCE(society.timezone, 'Asia/Kolkata'))::date),
                      ((now() AT TIME ZONE COALESCE(society.timezone, 'Asia/Kolkata'))::date - 1)
           ) AS occurrence(shift_date)
          WHERE r.staff_id = $1
            AND r.society_id = $2
            AND r.status IN ('SCHEDULED', 'CONFIRMED')
            AND s.status = 'ACTIVE'
            AND occurrence.shift_date BETWEEN r.roster_date
                                          AND CASE WHEN r.roster_type = 'DAILY'
                                                   THEN 'infinity'::date
                                                   ELSE COALESCE(r.roster_end_date, r.roster_date)
                                              END
            AND now() >= ((occurrence.shift_date + s.start_time)
                AT TIME ZONE COALESCE(society.timezone, 'Asia/Kolkata'))
            AND now() < ((occurrence.shift_date + s.end_time +
                CASE WHEN s.is_overnight OR s.end_time <= s.start_time
                     THEN interval '1 day' ELSE interval '0 day' END)
                AT TIME ZONE COALESCE(society.timezone, 'Asia/Kolkata'))
          LIMIT 1`,
        [staff.id, req.user.societyId]
    );
    if (!shiftResult.rowCount) {
        const error = new Error("Attendance is available only during your assigned shift");
        error.statusCode = 403;
        throw error;
    }
    return {
        staffId: staff.id,
        attendanceDate: allowAfterShiftEnd
            ? attendanceDate
            : shiftResult.rows[0].attendance_date,
        scheduledShiftEnd: allowAfterShiftEnd
            ? shiftResult.rows[0].scheduled_shift_end
            : undefined
    };
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

        const guardAttendance = await resolveGuardStaffAndCheckShift(req, staffId, {
            allowAfterShiftEnd: Boolean(req.user?.guardEmployeeCode),
            attendanceDate
        });
        const result =
            await StaffAttendanceService
                .checkOut(
                    guardAttendance.staffId,
                    guardAttendance.attendanceDate || attendanceDate,
                    req.user?.guardEmployeeCode ? undefined : checkOutTime,
                    guardAttendance.scheduledShiftEnd
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
