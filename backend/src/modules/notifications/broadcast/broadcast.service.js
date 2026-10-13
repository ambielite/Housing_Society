
const broadcastRepository =
    require("./broadcast.repository");

const Society =
    require("../../../modules/societies/society/society.model");

const {
    validateCreateBroadcast,
    validateUpdateBroadcast,
    validateId
} = require("../notification-template/notification.validation");


// ============================================================
// CREATE BROADCAST
// ============================================================

const createBroadcast = async (data) => {

    const errors =
        validateCreateBroadcast(data);

    if (errors.length > 0) {
        throw new Error(
            errors.join(", ")
        );
    }


    // Check society
    const society =
        await Society.findByPk(
            data.societyId
        );

    if (!society) {
        throw new Error(
            "Society not found"
        );
    }


    // Validate audience
    if (
        data.audienceType === "SOCIETY" &&
        data.audienceIds &&
        data.audienceIds.length > 0
    ) {
        throw new Error(
            "audienceIds should not be provided for SOCIETY audience"
        );
    }


    if (
        (
            data.audienceType === "TOWER" ||
            data.audienceType === "USERS"
        ) &&
        (
            !data.audienceIds ||
            data.audienceIds.length === 0
        )
    ) {
        throw new Error(
            "audienceIds are required for TOWER or USERS audience"
        );
    }


    // Validate date relationship
    if (
        data.startAt &&
        data.endAt
    ) {

        const startDate =
            new Date(data.startAt);

        const endDate =
            new Date(data.endAt);

        if (endDate < startDate) {
            throw new Error(
                "endAt cannot be before startAt"
            );
        }
    }


    // Scheduled status
    if (data.scheduledAt) {

        if (
            new Date(data.scheduledAt) <=
            new Date()
        ) {
            throw new Error(
                "scheduledAt must be a future date"
            );
        }

        data.status = "SCHEDULED";
    }


    return await broadcastRepository.create(
        data
    );
};


// ============================================================
// GET ALL BROADCASTS
// ============================================================

const getAllBroadcasts = async (
    filters = {}
) => {

    const where = {};


    if (filters.societyId) {
        where.societyId =
            filters.societyId;
    }

    if (filters.broadcastType) {
        where.broadcastType =
            filters.broadcastType;
    }

    if (filters.audienceType) {
        where.audienceType =
            filters.audienceType;
    }

    if (filters.status) {
        where.status =
            filters.status;
    }

    if (filters.priority) {
        where.priority =
            filters.priority;
    }


    return await broadcastRepository.findAll(
        where
    );
};


// ============================================================
// GET BY ID
// ============================================================

const getBroadcastById = async (id) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid broadcast ID"
        );
    }


    const broadcast =
        await broadcastRepository.findById(
            id
        );

    if (!broadcast) {
        throw new Error(
            "Broadcast not found"
        );
    }


    return broadcast;
};


// ============================================================
// UPDATE
// ============================================================

const updateBroadcast = async (
    id,
    data
) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid broadcast ID"
        );
    }


    const errors =
        validateUpdateBroadcast(data);

    if (errors.length > 0) {
        throw new Error(
            errors.join(", ")
        );
    }


    const broadcast =
        await broadcastRepository.findById(
            id
        );

    if (!broadcast) {
        throw new Error(
            "Broadcast not found"
        );
    }


    if (
        broadcast.status === "SENT" ||
        broadcast.status === "SENDING"
    ) {
        throw new Error(
            "Sent or sending broadcast cannot be updated"
        );
    }


    if (
        broadcast.status === "CANCELLED"
    ) {
        throw new Error(
            "Cancelled broadcast cannot be updated"
        );
    }


    if (
        data.startAt &&
        data.endAt
    ) {

        if (
            new Date(data.endAt) <
            new Date(data.startAt)
        ) {
            throw new Error(
                "endAt cannot be before startAt"
            );
        }
    }


    if (data.scheduledAt) {

        if (
            new Date(data.scheduledAt) <=
            new Date()
        ) {
            throw new Error(
                "scheduledAt must be a future date"
            );
        }

        data.status = "SCHEDULED";
    }


    return await broadcastRepository.update(
        broadcast,
        data
    );
};


// ============================================================
// SCHEDULE BROADCAST
// ============================================================

const scheduleBroadcast = async (id, scheduledAt) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid broadcast ID"
        );
    }


    if (
        !scheduledAt ||
        isNaN(Date.parse(scheduledAt))
    ) {
        throw new Error(
            "Valid scheduledAt is required"
        );
    }


    const scheduledDate =
        new Date(scheduledAt);


    if (scheduledDate <= new Date()) {
        throw new Error(
            "scheduledAt must be a future date"
        );
    }


    const broadcast =
        await broadcastRepository.findById(
            id
        );

    if (!broadcast) {
        throw new Error(
            "Broadcast not found"
        );
    }


    if (
        broadcast.status === "SENT" ||
        broadcast.status === "SENDING"
    ) {
        throw new Error(
            "Broadcast cannot be scheduled"
        );
    }


    return await broadcastRepository.update(
        broadcast,
        {
            scheduledAt: scheduledDate,
            status: "SCHEDULED"
        }
    );
};


// ============================================================
// START SENDING
// ============================================================

const startBroadcast = async (id) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid broadcast ID"
        );
    }


    const broadcast =
        await broadcastRepository.findById(
            id
        );

    if (!broadcast) {
        throw new Error(
            "Broadcast not found"
        );
    }


    if (
        broadcast.status === "SENT"
    ) {
        throw new Error(
            "Broadcast has already been sent"
        );
    }


    if (
        broadcast.status === "CANCELLED"
    ) {
        throw new Error(
            "Cancelled broadcast cannot be sent"
        );
    }


    if (
        broadcast.scheduledAt &&
        new Date(broadcast.scheduledAt) >
        new Date()
    ) {
        throw new Error(
            "Broadcast is scheduled for a future time"
        );
    }


    return await broadcastRepository.update(
        broadcast,
        {
            status: "SENDING"
        }
    );
};


// ============================================================
// MARK AS SENT
// ============================================================

const markAsSent = async (
    id,
    recipientCount = 0
) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid broadcast ID"
        );
    }


    const broadcast =
        await broadcastRepository.findById(
            id
        );

    if (!broadcast) {
        throw new Error(
            "Broadcast not found"
        );
    }


    if (
        broadcast.status === "CANCELLED"
    ) {
        throw new Error(
            "Cancelled broadcast cannot be marked as sent"
        );
    }


    if (
        recipientCount < 0 ||
        !Number.isInteger(
            Number(recipientCount)
        )
    ) {
        throw new Error(
            "recipientCount must be a valid non-negative integer"
        );
    }


    return await broadcastRepository.update(
        broadcast,
        {
            status: "SENT",
            sentAt: new Date(),
            recipientCount:
                Number(recipientCount)
        }
    );
};


// ============================================================
// CANCEL
// ============================================================

const cancelBroadcast = async (id) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid broadcast ID"
        );
    }


    const broadcast =
        await broadcastRepository.findById(
            id
        );

    if (!broadcast) {
        throw new Error(
            "Broadcast not found"
        );
    }


    if (
        broadcast.status === "SENT"
    ) {
        throw new Error(
            "Sent broadcast cannot be cancelled"
        );
    }


    return await broadcastRepository.update(
        broadcast,
        {
            status: "CANCELLED",
            cancelledAt: new Date()
        }
    );
};


// ============================================================
// DELETE
// ============================================================

const deleteBroadcast = async (id) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid broadcast ID"
        );
    }


    const broadcast =
        await broadcastRepository.findById(
            id
        );

    if (!broadcast) {
        throw new Error(
            "Broadcast not found"
        );
    }


    if (
        broadcast.status === "SENDING" ||
        broadcast.status === "SENT"
    ) {
        throw new Error(
            "Sending or sent broadcast cannot be deleted"
        );
    }


    await broadcastRepository.remove(
        broadcast
    );


    return true;
};


module.exports = {
    createBroadcast,
    getAllBroadcasts,
    getBroadcastById,
    updateBroadcast,
    scheduleBroadcast,
    startBroadcast,
    markAsSent,
    cancelBroadcast,
    deleteBroadcast
};

