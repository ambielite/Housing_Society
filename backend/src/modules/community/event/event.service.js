const { Op } = require("sequelize");

const Society =
    require("../../societies/society/society.model");

const eventRepository =
    require("./event.repository");

const rsvpRepository =
    require("./eventRsvp.repository");

const {
    validateCreateEvent,
    validateUpdateEvent,
    validateApproval,
    validateCancellation
} = require("./event.validation");


const createEvent = async (data) => {

    validateCreateEvent(data);

    const society =
        await Society.findByPk(data.societyId);

    if (!society) {
        throw new Error("Society not found");
    }

    return await eventRepository.create({
        ...data,
        status: "DRAFT"
    });
};


const getEvents = async (filters = {}) => {

    const where = {};

    if (filters.societyId) {
        where.societyId = filters.societyId;
    }

    if (filters.category) {
        where.category = filters.category;
    }

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.createdBy) {
        where.createdBy = filters.createdBy;
    }

    if (filters.search) {

        where[Op.or] = [
            {
                title: {
                    [Op.iLike]:
                        `%${filters.search}%`
                }
            },
            {
                description: {
                    [Op.iLike]:
                        `%${filters.search}%`
                }
            },
            {
                venue: {
                    [Op.iLike]:
                        `%${filters.search}%`
                }
            }
        ];
    }

    return await eventRepository.findAll(where);
};


const getEventById = async (id) => {

    const event =
        await eventRepository.findById(id);

    if (!event) {
        throw new Error("Event not found");
    }

    return event;
};


const updateEvent = async (id, data) => {

    validateUpdateEvent(data);

    const event =
        await getEventById(id);

    if (
        event.status === "PUBLISHED" ||
        event.status === "COMPLETED" ||
        event.status === "CANCELLED"
    ) {
        throw new Error(
            "Published, completed or cancelled events cannot be updated"
        );
    }

    return await eventRepository.update(
        event,
        data
    );
};


const submitEventForApproval = async (id) => {

    const event =
        await getEventById(id);

    if (
        event.status !== "DRAFT"
    ) {
        throw new Error(
            "Only draft events can be submitted"
        );
    }

    return await eventRepository.update(
        event,
        {
            status: "PENDING_APPROVAL"
        }
    );
};


const approveEvent = async (id, data) => {

    validateApproval(data);

    const event =
        await getEventById(id);

    if (
        event.status !== "PENDING_APPROVAL"
    ) {
        throw new Error(
            "Only pending events can be approved"
        );
    }

    return await eventRepository.update(
        event,
        {
            status: "APPROVED",
            approvedBy: data.approvedBy,
            approvedAt: new Date()
        }
    );
};


const publishEvent = async (id) => {

    const event =
        await getEventById(id);

    if (event.status !== "APPROVED") {
        throw new Error(
            "Only approved events can be published"
        );
    }

    return await eventRepository.update(
        event,
        {
            status: "PUBLISHED",
            publishedAt: new Date()
        }
    );
};


const cancelEvent = async (id, data) => {

    validateCancellation(data);

    const event =
        await getEventById(id);

    if (
        event.status === "COMPLETED" ||
        event.status === "CANCELLED"
    ) {
        throw new Error(
            "Event cannot be cancelled"
        );
    }

    return await eventRepository.update(
        event,
        {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancellationReason:
                data.cancellationReason
        }
    );
};


const completeEvent = async (id) => {

    const event =
        await getEventById(id);

    if (event.status !== "PUBLISHED") {
        throw new Error(
            "Only published events can be completed"
        );
    }

    return await eventRepository.update(
        event,
        {
            status: "COMPLETED",
            completedAt: new Date()
        }
    );
};


const deleteEvent = async (id) => {

    const event =
        await getEventById(id);

    if (
        event.status === "PUBLISHED" ||
        event.status === "COMPLETED"
    ) {
        throw new Error(
            "Published or completed events cannot be deleted"
        );
    }

    return await eventRepository.deleteEvent(
        event
    );
};


module.exports = {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    submitEventForApproval,
    approveEvent,
    publishEvent,
    cancelEvent,
    completeEvent,
    deleteEvent
};