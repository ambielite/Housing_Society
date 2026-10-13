const Staff =
    require("../staff/staff.model");

const StaffAttendanceRepository =
    require("./staffAttendance.repository");

const {
    validateCreate,
    validateUpdate
} = require("./staffAttendance.validation");


const createAttendance = async (
    data
) => {

    validateCreate(data);

    const staff =
        await Staff.findByPk(
            data.staffId
        );

    if (!staff) {
        throw new Error(
            "Staff not found"
        );
    }

    if (staff.status === "TERMINATED") {
        throw new Error(
            "Attendance cannot be created for terminated staff"
        );
    }

    const existing =
        await StaffAttendanceRepository
            .findByStaffAndDate(
                data.staffId,
                data.attendanceDate
            );

    if (existing) {
        throw new Error(
            "Attendance already exists for this staff member on this date"
        );
    }

    return await StaffAttendanceRepository
        .create(data);
};


const getAttendanceById = async (
    id
) => {

    const attendance =
        await StaffAttendanceRepository
            .findById(id);

    if (!attendance) {
        throw new Error(
            "Attendance record not found"
        );
    }

    return attendance;
};


const getAttendanceByStaff = async (
    staffId
) => {

    const staff =
        await Staff.findByPk(
            staffId
        );

    if (!staff) {
        throw new Error(
            "Staff not found"
        );
    }

    return await StaffAttendanceRepository
        .findByStaffId(staffId);
};


const getAllAttendance = async (
    filters = {}
) => {

    return await StaffAttendanceRepository
        .findAll(filters);
};


const checkIn = async (
    staffId,
    attendanceDate,
    checkInTime
) => {

    const staff =
        await Staff.findByPk(
            staffId
        );

    if (!staff) {
        throw new Error(
            "Staff not found"
        );
    }

    if (staff.status !== "ACTIVE") {
        throw new Error(
            "Only active staff can check in"
        );
    }

    let attendance =
        await StaffAttendanceRepository
            .findByStaffAndDate(
                staffId,
                attendanceDate
            );

    if (!attendance) {

        attendance =
            await StaffAttendanceRepository
                .create({
                    staffId,
                    attendanceDate,
                    checkInTime:
                        checkInTime || new Date(),
                    status: "PRESENT"
                });

        return attendance;
    }

    if (attendance.checkInTime) {

        throw new Error(
            "Staff has already checked in"
        );
    }

    return await StaffAttendanceRepository
        .update(
            attendance,
            {
                checkInTime:
                    checkInTime || new Date(),
                status: "PRESENT"
            }
        );
};


const checkOut = async (
    staffId,
    attendanceDate,
    checkOutTime
) => {

    const attendance =
        await StaffAttendanceRepository
            .findByStaffAndDate(
                staffId,
                attendanceDate
            );

    if (!attendance) {
        throw new Error(
            "Attendance record not found. Staff must check in first."
        );
    }

    if (!attendance.checkInTime) {
        throw new Error(
            "Check-in time is missing"
        );
    }

    if (attendance.checkOutTime) {
        throw new Error(
            "Staff has already checked out"
        );
    }

    const finalCheckOut =
        checkOutTime || new Date();

    const checkIn =
        new Date(
            attendance.checkInTime
        );

    const checkOut =
        new Date(
            finalCheckOut
        );

    if (checkOut <= checkIn) {
        throw new Error(
            "Check-out time must be after check-in time"
        );
    }

    const milliseconds =
        checkOut.getTime() -
        checkIn.getTime();

    const workingMinutes =
        Math.floor(
            milliseconds / 60000
        );

    return await StaffAttendanceRepository
        .update(
            attendance,
            {
                checkOutTime:
                    finalCheckOut,
                workingMinutes
            }
        );
};


const markAbsent = async (
    staffId,
    attendanceDate,
    remarks
) => {

    const staff =
        await Staff.findByPk(
            staffId
        );

    if (!staff) {
        throw new Error(
            "Staff not found"
        );
    }

    const existing =
        await StaffAttendanceRepository
            .findByStaffAndDate(
                staffId,
                attendanceDate
            );

    if (existing) {
        throw new Error(
            "Attendance already exists for this date"
        );
    }

    return await StaffAttendanceRepository
        .create({
            staffId,
            attendanceDate,
            status: "ABSENT",
            remarks: remarks || null
        });
};


const markLeave = async (
    staffId,
    attendanceDate,
    remarks
) => {

    const staff =
        await Staff.findByPk(
            staffId
        );

    if (!staff) {
        throw new Error(
            "Staff not found"
        );
    }

    const existing =
        await StaffAttendanceRepository
            .findByStaffAndDate(
                staffId,
                attendanceDate
            );

    if (existing) {
        throw new Error(
            "Attendance already exists for this date"
        );
    }

    return await StaffAttendanceRepository
        .create({
            staffId,
            attendanceDate,
            status: "ON_LEAVE",
            remarks: remarks || null
        });
};


const updateAttendance = async (
    id,
    data
) => {

    validateUpdate(data);

    const attendance =
        await StaffAttendanceRepository
            .findById(id);

    if (!attendance) {
        throw new Error(
            "Attendance record not found"
        );
    }

    return await StaffAttendanceRepository
        .update(
            attendance,
            data
        );
};


const deleteAttendance = async (
    id
) => {

    const attendance =
        await StaffAttendanceRepository
            .findById(id);

    if (!attendance) {
        throw new Error(
            "Attendance record not found"
        );
    }

    await StaffAttendanceRepository
        .remove(attendance);

    return {
        message:
            "Attendance record deleted successfully"
    };
};


module.exports = {
    createAttendance,
    getAttendanceById,
    getAttendanceByStaff,
    getAllAttendance,
    checkIn,
    checkOut,
    markAbsent,
    markLeave,
    updateAttendance,
    deleteAttendance
};