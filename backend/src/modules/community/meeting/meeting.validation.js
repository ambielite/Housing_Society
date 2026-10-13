const MEETING_TYPES = [
    "GENERAL",
    "COMMITTEE",
    "BOARD",
    "AGM",
    "SGM",
    "EMERGENCY",
    "OTHER"
];

const MEETING_STATUSES = [
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "SCHEDULED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED"
];

const AGENDA_STATUSES = [
    "OPEN",
    "DISCUSSED",
    "DEFERRED",
    "CLOSED"
];

const ATTENDANCE_STATUSES = [
    "PRESENT",
    "ABSENT",
    "LATE",
    "EXCUSED"
];

const MINUTES_STATUSES = [
    "DRAFT",
    "SUBMITTED",
    "APPROVED",
    "REJECTED"
];

const ACTION_ITEM_STATUSES = [
    "OPEN",
    "IN_PROGRESS",
    "COMPLETED",
    "OVERDUE",
    "CANCELLED"
];

const PRIORITIES = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL"
];


const validateCreateMeeting = (data) => {

    if (!data.societyId) {
        throw new Error("societyId is required");
    }

    if (!data.createdBy) {
        throw new Error("createdBy is required");
    }

    if (!data.title) {
        throw new Error("title is required");
    }

    if (!data.meetingType) {
        throw new Error("meetingType is required");
    }

    if (!MEETING_TYPES.includes(data.meetingType)) {
        throw new Error("Invalid meetingType");
    }

    if (!data.scheduledAt) {
        throw new Error("scheduledAt is required");
    }

    const scheduledAt =
        new Date(data.scheduledAt);

    if (Number.isNaN(scheduledAt.getTime())) {
        throw new Error("Invalid scheduledAt");
    }

    if (data.endAt) {

        const endAt =
            new Date(data.endAt);

        if (Number.isNaN(endAt.getTime())) {
            throw new Error("Invalid endAt");
        }

        if (endAt <= scheduledAt) {
            throw new Error(
                "endAt must be after scheduledAt"
            );
        }
    }

    return true;
};


const validateUpdateMeeting = (data) => {

    if (
        data.meetingType &&
        !MEETING_TYPES.includes(data.meetingType)
    ) {
        throw new Error("Invalid meetingType");
    }

    return true;
};


const validateAgenda = (data) => {

    if (!data.meetingId) {
        throw new Error("meetingId is required");
    }

    if (!data.title) {
        throw new Error("Agenda title is required");
    }

    if (
        data.agendaOrder !== undefined &&
        Number(data.agendaOrder) < 1
    ) {
        throw new Error(
            "agendaOrder must be greater than 0"
        );
    }

    return true;
};


const validateAttendance = (data) => {

    if (!data.meetingId) {
        throw new Error("meetingId is required");
    }

    if (!data.userId) {
        throw new Error("userId is required");
    }

    if (
        data.attendanceStatus &&
        !ATTENDANCE_STATUSES.includes(
            data.attendanceStatus
        )
    ) {
        throw new Error(
            "Invalid attendanceStatus"
        );
    }

    return true;
};


const validateMinutes = (data) => {

    if (!data.meetingId) {
        throw new Error("meetingId is required");
    }

    if (!data.preparedBy) {
        throw new Error("preparedBy is required");
    }

    if (!data.summary) {
        throw new Error("summary is required");
    }

    return true;
};


const validateActionItem = (data) => {

    if (!data.meetingId) {
        throw new Error("meetingId is required");
    }

    if (!data.assignedTo) {
        throw new Error("assignedTo is required");
    }

    if (!data.title) {
        throw new Error("Action item title is required");
    }

    if (
        data.priority &&
        !PRIORITIES.includes(data.priority)
    ) {
        throw new Error("Invalid priority");
    }

    return true;
};


module.exports = {
    MEETING_TYPES,
    MEETING_STATUSES,
    AGENDA_STATUSES,
    ATTENDANCE_STATUSES,
    MINUTES_STATUSES,
    ACTION_ITEM_STATUSES,
    PRIORITIES,
    validateCreateMeeting,
    validateUpdateMeeting,
    validateAgenda,
    validateAttendance,
    validateMinutes,
    validateActionItem
};