const { Op } = require("sequelize");

const Society =
    require("../../societies/society/society.model");

const repository =
    require("./meeting.repository");

const {
    validateCreateMeeting,
    validateUpdateMeeting
} = require("./meeting.validation");


const createMeeting = async (data) => {

    validateCreateMeeting(data);

    const society =
        await Society.findByPk(
            data.societyId
        );

    if (!society) {
        throw new Error("Society not found");
    }

    return await repository.create({
        ...data,
        status: "DRAFT"
    });
};


const getMeetings = async (filters = {}) => {

    const where = {};

    if (filters.societyId) {
        where.societyId = filters.societyId;
    }

    if (filters.meetingType) {
        where.meetingType =
            filters.meetingType;
    }

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.createdBy) {
        where.createdBy =
            filters.createdBy;
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
            }
        ];
    }

    return await repository.findAll(where);
};


const getMeetingById = async (id) => {

    const meeting =
        await repository.findById(id);

    if (!meeting) {
        throw new Error("Meeting not found");
    }

    return meeting;
};


const updateMeeting = async (
    id,
    data
) => {

    validateUpdateMeeting(data);

    const meeting =
        await getMeetingById(id);

    if (
        meeting.status === "IN_PROGRESS" ||
        meeting.status === "COMPLETED" ||
        meeting.status === "CANCELLED"
    ) {
        throw new Error(
            "Meeting cannot be updated in its current status"
        );
    }

    return await repository.update(
        meeting,
        data
    );
};


const submitForApproval = async (id) => {

    const meeting =
        await getMeetingById(id);

    if (meeting.status !== "DRAFT") {
        throw new Error(
            "Only draft meetings can be submitted"
        );
    }

    return await repository.update(
        meeting,
        {
            status: "PENDING_APPROVAL"
        }
    );
};


const approveMeeting = async (
    id,
    data
) => {

    if (!data.approvedBy) {
        throw new Error(
            "approvedBy is required"
        );
    }

    const meeting =
        await getMeetingById(id);

    if (
        meeting.status !== "PENDING_APPROVAL"
    ) {
        throw new Error(
            "Only pending meetings can be approved"
        );
    }

    return await repository.update(
        meeting,
        {
            status: "APPROVED",
            approvedBy: data.approvedBy,
            approvedAt: new Date(),
            approvalNote:
                data.approvalNote || null
        }
    );
};


const scheduleMeeting = async (id) => {

    const meeting =
        await getMeetingById(id);

    if (meeting.status !== "APPROVED") {
        throw new Error(
            "Only approved meetings can be scheduled"
        );
    }

    return await repository.update(
        meeting,
        {
            status: "SCHEDULED"
        }
    );
};


const startMeeting = async (id) => {

    const meeting =
        await getMeetingById(id);

    if (
        meeting.status !== "SCHEDULED"
    ) {
        throw new Error(
            "Only scheduled meetings can be started"
        );
    }

    return await repository.update(
        meeting,
        {
            status: "IN_PROGRESS",
            startedAt: new Date()
        }
    );
};


const completeMeeting = async (id) => {

    const meeting =
        await getMeetingById(id);

    if (
        meeting.status !== "IN_PROGRESS"
    ) {
        throw new Error(
            "Only in-progress meetings can be completed"
        );
    }

    return await repository.update(
        meeting,
        {
            status: "COMPLETED",
            completedAt: new Date()
        }
    );
};


const cancelMeeting = async (
    id,
    cancellationReason
) => {

    if (!cancellationReason) {
        throw new Error(
            "cancellationReason is required"
        );
    }

    const meeting =
        await getMeetingById(id);

    if (
        meeting.status === "COMPLETED" ||
        meeting.status === "CANCELLED"
    ) {
        throw new Error(
            "Meeting cannot be cancelled"
        );
    }

    return await repository.update(
        meeting,
        {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancellationReason
        }
    );
};


const deleteMeeting = async (id) => {

    const meeting =
        await getMeetingById(id);

    if (
        meeting.status === "IN_PROGRESS" ||
        meeting.status === "COMPLETED"
    ) {
        throw new Error(
            "In-progress or completed meetings cannot be deleted"
        );
    }

    return await repository.deleteMeeting(
        meeting
    );
};


module.exports = {
    createMeeting,
    getMeetings,
    getMeetingById,
    updateMeeting,
    submitForApproval,
    approveMeeting,
    scheduleMeeting,
    startMeeting,
    completeMeeting,
    cancelMeeting,
    deleteMeeting
};