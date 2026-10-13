const meetingRepository =
    require("./meeting.repository");

const repository =
    require("./meetingAttendance.repository");

const {
    validateAttendance
} = require("./meeting.validation");


const markAttendance = async (data) => {

    validateAttendance(data);

    const meeting =
        await meetingRepository.findById(
            data.meetingId
        );

    if (!meeting) {
        throw new Error("Meeting not found");
    }

    if (
        meeting.status !== "IN_PROGRESS" &&
        meeting.status !== "COMPLETED"
    ) {
        throw new Error(
            "Attendance can be recorded only during or after the meeting"
        );
    }

    const existing =
        await repository.findOne({
            meetingId: data.meetingId,
            userId: data.userId
        });

    if (existing) {

        return await repository.update(
            existing,
            {
                attendanceStatus:
                    data.attendanceStatus ||
                    "PRESENT",
                checkInAt:
                    data.checkInAt ||
                    existing.checkInAt ||
                    new Date(),
                remarks:
                    data.remarks ||
                    existing.remarks
            }
        );
    }

    return await repository.create({
        meetingId: data.meetingId,
        userId: data.userId,
        attendanceStatus:
            data.attendanceStatus ||
            "PRESENT",
        checkInAt:
            data.checkInAt ||
            new Date(),
        remarks:
            data.remarks || null
    });
};


const getAttendance = async (
    filters = {}
) => {

    const where = {};

    if (filters.meetingId) {
        where.meetingId =
            filters.meetingId;
    }

    if (filters.userId) {
        where.userId =
            filters.userId;
    }

    if (filters.attendanceStatus) {
        where.attendanceStatus =
            filters.attendanceStatus;
    }

    return await repository.findAll(where);
};


const getAttendanceById = async (id) => {

    const attendance =
        await repository.findById(id);

    if (!attendance) {
        throw new Error(
            "Attendance record not found"
        );
    }

    return attendance;
};


const checkOut = async (id) => {

    const attendance =
        await getAttendanceById(id);

    return await repository.update(
        attendance,
        {
            checkOutAt: new Date()
        }
    );
};


const deleteAttendance = async (id) => {

    const attendance =
        await getAttendanceById(id);

    return await repository.deleteAttendance(
        attendance
    );
};


module.exports = {
    markAttendance,
    getAttendance,
    getAttendanceById,
    checkOut,
    deleteAttendance
};