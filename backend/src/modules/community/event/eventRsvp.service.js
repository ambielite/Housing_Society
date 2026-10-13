const { Op } = require("sequelize");

const eventRepository =
    require("./event.repository");

const rsvpRepository =
    require("./eventRsvp.repository");

const {
    validateRsvp
} = require("./event.validation");


const registerForEvent = async (data) => {

    validateRsvp(data);

    const event =
        await eventRepository.findById(
            data.eventId
        );

    if (!event) {
        throw new Error("Event not found");
    }

    if (event.status !== "PUBLISHED") {
        throw new Error(
            "Registration is allowed only for published events"
        );
    }

    const now = new Date();

    if (
        event.registrationStartAt &&
        now < new Date(event.registrationStartAt)
    ) {
        throw new Error(
            "Event registration has not started"
        );
    }

    if (
        event.registrationEndAt &&
        now > new Date(event.registrationEndAt)
    ) {
        throw new Error(
            "Event registration has ended"
        );
    }

    if (now >= new Date(event.startAt)) {
        throw new Error(
            "Event has already started"
        );
    }

    const existing =
        await rsvpRepository.findOne({
            eventId: data.eventId,
            userId: data.userId,
            status: {
                [Op.in]: [
                    "REGISTERED",
                    "WAITLISTED",
                    "CHECKED_IN"
                ]
            }
        });

    if (existing) {
        throw new Error(
            "User is already registered for this event"
        );
    }

    const guestCount =
        Number(data.guestCount || 0);

    const totalTickets =
        Number(data.totalTickets || 1);

    const requestedSeats =
        totalTickets + guestCount;

    if (event.capacity) {

        const registered =
            await rsvpRepository.count({
                eventId: event.id,
                status: {
                    [Op.in]: [
                        "REGISTERED",
                        "CHECKED_IN"
                    ]
                }
            });

        if (
            registered + requestedSeats >
            event.capacity
        ) {
            throw new Error(
                "Event capacity exceeded"
            );
        }
    }

    let ticketPrice =
        Number(event.ticketPrice || 0);

    let totalAmount = 0;

    let paymentStatus =
        "NOT_REQUIRED";

    if (!event.isFree) {

        totalAmount =
            ticketPrice * totalTickets;

        paymentStatus =
            "PENDING";
    }

    return await rsvpRepository.create({
        eventId: event.id,
        societyId: data.societyId,
        userId: data.userId,
        guestCount,
        totalTickets,
        ticketPrice,
        totalAmount,
        paymentStatus,
        status: "REGISTERED",
        remarks: data.remarks || null
    });
};


const getRsvps = async (filters = {}) => {

    const where = {};

    if (filters.eventId) {
        where.eventId = filters.eventId;
    }

    if (filters.societyId) {
        where.societyId = filters.societyId;
    }

    if (filters.userId) {
        where.userId = filters.userId;
    }

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.paymentStatus) {
        where.paymentStatus =
            filters.paymentStatus;
    }

    return await rsvpRepository.findAll(
        where
    );
};


const getRsvpById = async (id) => {

    const rsvp =
        await rsvpRepository.findById(id);

    if (!rsvp) {
        throw new Error("RSVP not found");
    }

    return rsvp;
};


const cancelRsvp = async (id) => {

    const rsvp =
        await getRsvpById(id);

    if (
        rsvp.status === "CANCELLED"
    ) {
        throw new Error(
            "RSVP is already cancelled"
        );
    }

    if (
        rsvp.status === "CHECKED_IN"
    ) {
        throw new Error(
            "Checked-in RSVP cannot be cancelled"
        );
    }

    return await rsvpRepository.update(
        rsvp,
        {
            status: "CANCELLED",
            cancelledAt: new Date()
        }
    );
};


const markPaymentPaid = async (
    id,
    paymentReference
) => {

    const rsvp =
        await getRsvpById(id);

    if (
        rsvp.paymentStatus !== "PENDING"
    ) {
        throw new Error(
            "Payment is not pending"
        );
    }

    return await rsvpRepository.update(
        rsvp,
        {
            paymentStatus: "PAID",
            paymentReference:
                paymentReference || null
        }
    );
};


const markPaymentFailed = async (id) => {

    const rsvp =
        await getRsvpById(id);

    if (
        rsvp.paymentStatus !== "PENDING"
    ) {
        throw new Error(
            "Payment is not pending"
        );
    }

    return await rsvpRepository.update(
        rsvp,
        {
            paymentStatus: "FAILED"
        }
    );
};


const checkIn = async (id) => {

    const rsvp =
        await getRsvpById(id);

    if (rsvp.status !== "REGISTERED") {
        throw new Error(
            "Only registered users can check in"
        );
    }

    if (
        rsvp.paymentStatus !== "NOT_REQUIRED" &&
        rsvp.paymentStatus !== "PAID"
    ) {
        throw new Error(
            "Payment must be completed before check-in"
        );
    }

    return await rsvpRepository.update(
        rsvp,
        {
            status: "CHECKED_IN",
            checkedInAt: new Date()
        }
    );
};


const markNoShow = async (id) => {

    const rsvp =
        await getRsvpById(id);

    if (rsvp.status !== "REGISTERED") {
        throw new Error(
            "Only registered RSVPs can be marked as no-show"
        );
    }

    return await rsvpRepository.update(
        rsvp,
        {
            status: "NO_SHOW"
        }
    );
};


const deleteRsvp = async (id) => {

    const rsvp =
        await getRsvpById(id);

    if (rsvp.status === "CHECKED_IN") {
        throw new Error(
            "Checked-in RSVP cannot be deleted"
        );
    }

    return await rsvpRepository.deleteRsvp(
        rsvp
    );
};


module.exports = {
    registerForEvent,
    getRsvps,
    getRsvpById,
    cancelRsvp,
    markPaymentPaid,
    markPaymentFailed,
    checkIn,
    markNoShow,
    deleteRsvp
};