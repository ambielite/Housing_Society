
const EVENT_CATEGORIES = [
    "SOCIAL",
    "SPORTS",
    "CULTURAL",
    "EDUCATIONAL",
    "FESTIVAL",
    "MEETING",
    "WORKSHOP",
    "OTHER"
];

const EVENT_STATUSES = [
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "PUBLISHED",
    "CANCELLED",
    "COMPLETED",
    "EXPIRED"
];

const RSVP_STATUSES = [
    "REGISTERED",
    "WAITLISTED",
    "CANCELLED",
    "CHECKED_IN",
    "NO_SHOW"
];

const PAYMENT_STATUSES = [
    "NOT_REQUIRED",
    "PENDING",
    "PAID",
    "FAILED",
    "REFUNDED"
];

const indiaDate = (date) => new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
}).format(date);

const validateEventDateIsNotPast = (value, field) => {
    if (!value) return;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return;
    // datetime-local form values have no timezone; preserve the date selected by the admin.
    const inputDate = /^\d{4}-\d{2}-\d{2}T/.test(String(value)) && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(String(value))
        ? String(value).slice(0, 10)
        : indiaDate(parsed);
    if (inputDate < indiaDate(new Date())) {
        throw new Error(`${field} cannot be in the past`);
    }
};


const validateCreateEvent = (data) => {

    if (!data.societyId) {
        throw new Error("societyId is required");
    }

    if (!data.createdBy) {
        throw new Error("createdBy is required");
    }

    if (!data.title) {
        throw new Error("title is required");
    }

    if (!data.description) {
        throw new Error("description is required");
    }

    if (!data.category) {
        throw new Error("category is required");
    }

    if (!EVENT_CATEGORIES.includes(data.category)) {
        throw new Error("Invalid event category");
    }

    if (!data.venue) {
        throw new Error("venue is required");
    }

    if (!data.startAt) {
        throw new Error("startAt is required");
    }

    if (!data.endAt) {
        throw new Error("endAt is required");
    }

    const start = new Date(data.startAt);
    const end = new Date(data.endAt);

    if (Number.isNaN(start.getTime())) {
        throw new Error("Invalid startAt");
    }

    if (Number.isNaN(end.getTime())) {
        throw new Error("Invalid endAt");
    }

    validateEventDateIsNotPast(data.startAt, "Event start date");
    validateEventDateIsNotPast(data.endAt, "Event end date");
    validateEventDateIsNotPast(data.registrationStartAt, "Registration open date");
    validateEventDateIsNotPast(data.registrationEndAt, "Registration close date");

    if (end <= start) {
        throw new Error("endAt must be after startAt");
    }

    if (
        data.capacity !== undefined &&
        data.capacity !== null &&
        Number(data.capacity) < 1
    ) {
        throw new Error("capacity must be greater than 0");
    }

    if (
        data.ticketPrice !== undefined &&
        data.ticketPrice !== null &&
        Number(data.ticketPrice) < 0
    ) {
        throw new Error("ticketPrice cannot be negative");
    }

    if (
        data.registrationStartAt &&
        data.registrationEndAt
    ) {
        const registrationStart =
            new Date(data.registrationStartAt);

        const registrationEnd =
            new Date(data.registrationEndAt);

        if (
            Number.isNaN(registrationStart.getTime()) ||
            Number.isNaN(registrationEnd.getTime())
        ) {
            throw new Error(
                "Invalid registration dates"
            );
        }

        if (registrationEnd <= registrationStart) {
            throw new Error(
                "registrationEndAt must be after registrationStartAt"
            );
        }

        if (registrationEnd > start) {
            throw new Error(
                "registrationEndAt cannot be after event start"
            );
        }
    }

    return true;
};


const validateUpdateEvent = (data) => {

    if (
        data.category &&
        !EVENT_CATEGORIES.includes(data.category)
    ) {
        throw new Error("Invalid event category");
    }

    if (
        data.ticketPrice !== undefined &&
        data.ticketPrice !== null &&
        Number(data.ticketPrice) < 0
    ) {
        throw new Error("ticketPrice cannot be negative");
    }

    if (
        data.capacity !== undefined &&
        data.capacity !== null &&
        Number(data.capacity) < 1
    ) {
        throw new Error("capacity must be greater than 0");
    }

    return true;
};


const validateApproval = (data) => {

    if (!data.approvedBy) {
        throw new Error("approvedBy is required");
    }

    return true;
};


const validateCancellation = (data) => {

    if (!data.cancellationReason) {
        throw new Error(
            "cancellationReason is required"
        );
    }

    return true;
};


const validateRsvp = (data) => {

    if (!data.societyId) {
        throw new Error("societyId is required");
    }

    if (!data.userId) {
        throw new Error("userId is required");
    }

    if (
        data.guestCount !== undefined &&
        Number(data.guestCount) < 0
    ) {
        throw new Error(
            "guestCount cannot be negative"
        );
    }

    if (
        data.totalTickets !== undefined &&
        Number(data.totalTickets) < 1
    ) {
        throw new Error(
            "totalTickets must be at least 1"
        );
    }

    return true;
};


module.exports = {
    EVENT_CATEGORIES,
    EVENT_STATUSES,
    RSVP_STATUSES,
    PAYMENT_STATUSES,
    validateCreateEvent,
    validateUpdateEvent,
    validateApproval,
    validateCancellation,
    validateRsvp
};

