
const { Op } = require("sequelize");

const CommunityGovernanceMeeting =
    require("./governanceMeeting.model");

const CommunityMeeting =
    require("../meeting/meeting.model");

const Society =
    require("../../../modules/societies/society/society.model");

const repository =
    require("./governanceMeeting.repository");

const {
    validateCreateGovernanceMeeting,
    validateUpdateGovernanceMeeting,
    validateNotice,
    validateQuorum,
    validateCancellation
} = require("./governanceMeeting.validation");


// ============================================================
// CREATE AGM / SGM
// ============================================================

const createGovernanceMeeting = async (data) => {

    validateCreateGovernanceMeeting(data);

    const society =
        await Society.findByPk(data.societyId);

    if (!society) {
        throw new Error("Society not found");
    }

    const meeting =
        await CommunityMeeting.findByPk(data.meetingId);

    if (!meeting) {
        throw new Error("Community meeting not found");
    }

    if (
        meeting.societyId &&
        meeting.societyId !== data.societyId
    ) {
        throw new Error(
            "Meeting does not belong to the selected society"
        );
    }

    const existing =
        await repository.findOne({
            meetingId: data.meetingId
        });

    if (existing) {
        throw new Error(
            "Governance workflow already exists for this meeting"
        );
    }

    return await repository.create(data);
};


// ============================================================
// GET ALL
// ============================================================

const getGovernanceMeetings = async (filters = {}) => {

    const where = {};

    if (filters.societyId) {
        where.societyId = filters.societyId;
    }

    if (filters.meetingId) {
        where.meetingId = filters.meetingId;
    }

    if (filters.governanceType) {
        where.governanceType =
            filters.governanceType;
    }

    if (filters.financialYear) {
        where.financialYear =
            filters.financialYear;
    }

    if (filters.status) {
        where.status = filters.status;
    }

    return await repository.findAll(where);
};


// ============================================================
// GET BY ID
// ============================================================

const getGovernanceMeetingById = async (id) => {

    const record =
        await repository.findById(id);

    if (!record) {
        throw new Error(
            "Governance meeting not found"
        );
    }

    return record;
};


// ============================================================
// UPDATE
// ============================================================

const updateGovernanceMeeting = async (
    id,
    data
) => {

    validateUpdateGovernanceMeeting(data);

    const record =
        await repository.findById(id);

    if (!record) {
        throw new Error(
            "Governance meeting not found"
        );
    }

    if (
        [
            "COMPLETED",
            "MINUTES_APPROVED",
            "CANCELLED"
        ].includes(record.status)
    ) {
        throw new Error(
            "This governance meeting can no longer be updated"
        );
    }

    return await repository.update(
        record,
        data
    );
};


// ============================================================
// PUBLISH NOTICE
// ============================================================

const publishNotice = async (
    id,
    data
) => {

    validateNotice(data);

    const record =
        await repository.findById(id);

    if (!record) {
        throw new Error(
            "Governance meeting not found"
        );
    }

    if (
        !["DRAFT", "NOTICE_PUBLISHED"]
            .includes(record.status)
    ) {
        throw new Error(
            "Notice cannot be published in the current status"
        );
    }

    return await repository.update(
        record,
        {
            noticeDate: data.noticeDate,
            noticePublishedAt: new Date(),
            noticeDocument:
                data.noticeDocument || record.noticeDocument,
            noticePeriodDays:
                data.noticePeriodDays ||
                record.noticePeriodDays,
            status: "NOTICE_PUBLISHED"
        }
    );
};


// ============================================================
// SCHEDULE
// ============================================================

const scheduleMeeting = async (id) => {

    const record =
        await repository.findById(id);

    if (!record) {
        throw new Error(
            "Governance meeting not found"
        );
    }

    if (
        ![
            "NOTICE_PUBLISHED",
            "DRAFT"
        ].includes(record.status)
    ) {
        throw new Error(
            "Meeting cannot be scheduled in the current status"
        );
    }

    return await repository.update(
        record,
        {
            status: "SCHEDULED"
        }
    );
};


// ============================================================
// START MEETING
// ============================================================

const startMeeting = async (id) => {

    const record =
        await repository.findById(id);

    if (!record) {
        throw new Error(
            "Governance meeting not found"
        );
    }

    if (record.status !== "SCHEDULED") {
        throw new Error(
            "Only scheduled meetings can be started"
        );
    }

    return await repository.update(
        record,
        {
            status: "IN_PROGRESS"
        }
    );
};


// ============================================================
// UPDATE QUORUM
// ============================================================

const updateQuorum = async (
    id,
    data
) => {

    validateQuorum(data);

    const record =
        await repository.findById(id);

    if (!record) {
        throw new Error(
            "Governance meeting not found"
        );
    }

    const eligible =
        Number(data.eligibleMemberCount);

    const present =
        Number(data.presentMemberCount);

    const quorumRequired =
        Number(record.quorumRequired);

    const quorumReached =
        quorumRequired === 0
            ? true
            : present >= quorumRequired;

    let status = record.status;

    if (quorumReached) {
        status = "QUORUM_CONFIRMED";
    }

    return await repository.update(
        record,
        {
            eligibleMemberCount: eligible,
            presentMemberCount: present,
            quorumReached,
            status
        }
    );
};


// ============================================================
// COMPLETE MEETING
// ============================================================

const completeMeeting = async (id) => {

    const record =
        await repository.findById(id);

    if (!record) {
        throw new Error(
            "Governance meeting not found"
        );
    }

    if (
        ![
            "IN_PROGRESS",
            "QUORUM_CONFIRMED"
        ].includes(record.status)
    ) {
        throw new Error(
            "Meeting cannot be completed in the current status"
        );
    }

    if (
        record.quorumRequired > 0 &&
        !record.quorumReached
    ) {
        throw new Error(
            "Required quorum has not been reached"
        );
    }

    return await repository.update(
        record,
        {
            status: "MINUTES_PENDING",
            completedAt: new Date()
        }
    );
};


// ============================================================
// APPROVE MINUTES
// ============================================================

const approveMinutes = async (id) => {

    const record =
        await repository.findById(id);

    if (!record) {
        throw new Error(
            "Governance meeting not found"
        );
    }

    if (record.status !== "MINUTES_PENDING") {
        throw new Error(
            "Minutes cannot be approved in the current status"
        );
    }

    return await repository.update(
        record,
        {
            status: "MINUTES_APPROVED",
            minutesApprovedAt: new Date()
        }
    );
};


// ============================================================
// CANCEL
// ============================================================

const cancelMeeting = async (
    id,
    data
) => {

    validateCancellation(data);

    const record =
        await repository.findById(id);

    if (!record) {
        throw new Error(
            "Governance meeting not found"
        );
    }

    if (
        [
            "COMPLETED",
            "MINUTES_PENDING",
            "MINUTES_APPROVED",
            "CANCELLED"
        ].includes(record.status)
    ) {
        throw new Error(
            "Meeting cannot be cancelled in the current status"
        );
    }

    return await repository.update(
        record,
        {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancellationReason:
                data.cancellationReason
        }
    );
};


// ============================================================
// DELETE
// ============================================================

const deleteGovernanceMeeting = async (id) => {

    const record =
        await repository.findById(id);

    if (!record) {
        throw new Error(
            "Governance meeting not found"
        );
    }

    if (
        !["DRAFT", "CANCELLED"]
            .includes(record.status)
    ) {
        throw new Error(
            "Only DRAFT or CANCELLED governance meetings can be deleted"
        );
    }

    return await repository.deleteGovernanceMeeting(
        record
    );
};


module.exports = {
    createGovernanceMeeting,
    getGovernanceMeetings,
    getGovernanceMeetingById,
    updateGovernanceMeeting,
    publishNotice,
    scheduleMeeting,
    startMeeting,
    updateQuorum,
    completeMeeting,
    approveMinutes,
    cancelMeeting,
    deleteGovernanceMeeting
};

