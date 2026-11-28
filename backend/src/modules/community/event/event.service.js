const { Op } = require("sequelize");

const Society =
    require("../../societies/society/society.model");
const sequelize = require("../../../config/database");
const residentDashboardEvents = require("../../resident-dashboard/residentDashboardEvents");
const { notifySocietyResidents } = require("../../notifications/notification/residentActivityNotification");

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

const publishResidentEventUpdate = async (societyId) => {
    const [residents] = await sequelize.query(
        `SELECT DISTINCT u.id
           FROM users u
           JOIN user_roles ur ON ur.user_id = u.id
           JOIN roles r ON r.id = ur.role_id AND r.code IN ('RESIDENT_APP', 'RESIDENT') AND r.status = 'ACTIVE'
          WHERE u.society_id = :societyId AND u.status = 'ACTIVE'
            AND (ur.society_id = :societyId OR ur.society_id IS NULL)`,
        { replacements: { societyId } }
    );
    residentDashboardEvents.publishToUsers(residents.map((resident) => resident.id), "community-event-updated");
};


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

    const published = await eventRepository.update(
        event,
        {
            status: "PUBLISHED",
            publishedAt: new Date()
        }
    );
    await notifySocietyResidents({
        societyId: published.societyId,
        title: "New event published",
        message: `${published.title} has been published. See Upcoming activities to view the details.`,
        referenceType: "COMMUNITY_EVENT",
        referenceId: published.id,
        data: { eventId: published.id, title: published.title, category: published.category },
    });
    return published;
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

    const cancelled = await eventRepository.update(
        event,
        {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancellationReason:
                data.cancellationReason
        }
    );
    await publishResidentEventUpdate(cancelled.societyId);
    return cancelled;
};


const completeEvent = async (id) => {

    const event =
        await getEventById(id);

    if (event.status !== "PUBLISHED") {
        throw new Error(
            "Only published events can be completed"
        );
    }

    const completed = await eventRepository.update(
        event,
        {
            status: "COMPLETED",
            completedAt: new Date()
        }
    );
    await publishResidentEventUpdate(completed.societyId);
    return completed;
};


const deleteEvent = async (id) => {

    const event =
        await getEventById(id);
    const societyId = event.societyId;
    await eventRepository.deleteEvent(event);
    await publishResidentEventUpdate(societyId);
    return { id, deleted: true };
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
