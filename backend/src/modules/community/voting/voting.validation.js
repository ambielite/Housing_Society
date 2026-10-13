
const VOTING_TYPES = [
    "RESOLUTION",
    "ELECTION",
    "POLL",
    "AGM",
    "SGM",
    "OTHER"
];

const BALLOT_TYPES = [
    "SINGLE_CHOICE",
    "MULTIPLE_CHOICE",
    "YES_NO",
    "ELECTION"
];

const SECRECY_TYPES = [
    "OPEN",
    "SECRET"
];

const VOTING_STATUSES = [
    "DRAFT",
    "SCHEDULED",
    "OPEN",
    "CLOSED",
    "COUNTING",
    "RESULT_DECLARED",
    "CANCELLED"
];

const validateCreateVoting = (data) => {

    if (!data.societyId) {
        throw new Error("societyId is required");
    }

    if (!data.title) {
        throw new Error("title is required");
    }

    if (!data.votingType) {
        throw new Error("votingType is required");
    }

    if (!VOTING_TYPES.includes(data.votingType)) {
        throw new Error("Invalid votingType");
    }

    if (
        data.ballotType &&
        !BALLOT_TYPES.includes(data.ballotType)
    ) {
        throw new Error("Invalid ballotType");
    }

    if (
        data.secrecy &&
        !SECRECY_TYPES.includes(data.secrecy)
    ) {
        throw new Error("Invalid secrecy type");
    }

    if (
        data.quorumRequired !== undefined &&
        Number(data.quorumRequired) < 0
    ) {
        throw new Error(
            "quorumRequired cannot be negative"
        );
    }

    if (
        data.startAt &&
        data.endAt &&
        new Date(data.endAt) <=
        new Date(data.startAt)
    ) {
        throw new Error(
            "endAt must be greater than startAt"
        );
    }

    return true;
};


const validateCreateOption = (data) => {

    if (!data.votingId) {
        throw new Error("votingId is required");
    }

    if (!data.optionCode) {
        throw new Error("optionCode is required");
    }

    if (!data.optionLabel) {
        throw new Error("optionLabel is required");
    }

    return true;
};


const validateEligibility = (data) => {

    if (!data.votingId) {
        throw new Error("votingId is required");
    }

    if (!data.userId) {
        throw new Error("userId is required");
    }

    return true;
};


const validateCastVote = (data) => {

    if (!data.ballotToken) {
        throw new Error("ballotToken is required");
    }

    if (!data.optionId) {
        throw new Error("optionId is required");
    }

    return true;
};


const validateGovernanceRule = (data) => {

    if (!data.societyId) {
        throw new Error("societyId is required");
    }

    if (!data.ruleCode) {
        throw new Error("ruleCode is required");
    }

    if (!data.ruleName) {
        throw new Error("ruleName is required");
    }

    if (!data.ruleType) {
        throw new Error("ruleType is required");
    }

    if (!data.configuration) {
        throw new Error(
            "configuration is required"
        );
    }

    return true;
};


module.exports = {
    VOTING_TYPES,
    BALLOT_TYPES,
    SECRECY_TYPES,
    VOTING_STATUSES,
    validateCreateVoting,
    validateCreateOption,
    validateEligibility,
    validateCastVote,
    validateGovernanceRule
};

