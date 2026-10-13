
const GOVERNANCE_TYPES = [
    "AGM",
    "SGM"
];

const GOVERNANCE_STATUSES = [
    "DRAFT",
    "NOTICE_PUBLISHED",
    "SCHEDULED",
    "IN_PROGRESS",
    "QUORUM_CONFIRMED",
    "COMPLETED",
    "MINUTES_PENDING",
    "MINUTES_APPROVED",
    "CANCELLED"
];

const validateCreateGovernanceMeeting = (data) => {

    if (!data.societyId) {
        throw new Error("societyId is required");
    }

    if (!data.meetingId) {
        throw new Error("meetingId is required");
    }

    if (!data.governanceType) {
        throw new Error("governanceType is required");
    }

    if (!GOVERNANCE_TYPES.includes(data.governanceType)) {
        throw new Error("Invalid governanceType");
    }

    if (
        data.quorumRequired !== undefined &&
        (
            Number.isNaN(Number(data.quorumRequired)) ||
            Number(data.quorumRequired) < 0
        )
    ) {
        throw new Error("quorumRequired must be a positive number or zero");
    }

    return true;
};


const validateUpdateGovernanceMeeting = (data) => {

    if (
        data.governanceType &&
        !GOVERNANCE_TYPES.includes(data.governanceType)
    ) {
        throw new Error("Invalid governanceType");
    }

    if (
        data.status &&
        !GOVERNANCE_STATUSES.includes(data.status)
    ) {
        throw new Error("Invalid governance status");
    }

    if (
        data.quorumRequired !== undefined &&
        (
            Number.isNaN(Number(data.quorumRequired)) ||
            Number(data.quorumRequired) < 0
        )
    ) {
        throw new Error("Invalid quorumRequired");
    }

    return true;
};


const validateNotice = (data) => {

    if (!data.noticeDate) {
        throw new Error("noticeDate is required");
    }

    return true;
};


const validateQuorum = (data) => {

    if (
        data.eligibleMemberCount === undefined ||
        data.eligibleMemberCount === null
    ) {
        throw new Error("eligibleMemberCount is required");
    }

    if (
        data.presentMemberCount === undefined ||
        data.presentMemberCount === null
    ) {
        throw new Error("presentMemberCount is required");
    }

    if (Number(data.eligibleMemberCount) < 0) {
        throw new Error("eligibleMemberCount cannot be negative");
    }

    if (Number(data.presentMemberCount) < 0) {
        throw new Error("presentMemberCount cannot be negative");
    }

    if (
        Number(data.presentMemberCount) >
        Number(data.eligibleMemberCount)
    ) {
        throw new Error(
            "presentMemberCount cannot be greater than eligibleMemberCount"
        );
    }

    return true;
};


const validateCancellation = (data) => {

    if (!data.cancellationReason) {
        throw new Error("cancellationReason is required");
    }

    return true;
};


module.exports = {
    GOVERNANCE_TYPES,
    GOVERNANCE_STATUSES,
    validateCreateGovernanceMeeting,
    validateUpdateGovernanceMeeting,
    validateNotice,
    validateQuorum,
    validateCancellation
};

