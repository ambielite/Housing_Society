
const CONTENT_TYPES = [
    "POST",
    "COMMENT"
];

const REASONS = [
    "SPAM",
    "ABUSE",
    "HARASSMENT",
    "OFFENSIVE",
    "MISINFORMATION",
    "ILLEGAL_CONTENT",
    "ADVERTISEMENT",
    "DUPLICATE",
    "OTHER"
];

const PRIORITIES = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL"
];

const STATUSES = [
    "PENDING",
    "UNDER_REVIEW",
    "RESOLVED",
    "DISMISSED"
];

const ACTIONS = [
    "NONE",
    "HIDE",
    "UNHIDE",
    "DELETE",
    "WARN",
    "DISMISS"
];


const validateCreateModeration = (data) => {

    if (!data.societyId) {
        throw new Error("societyId is required");
    }

    if (!data.reporterId) {
        throw new Error("reporterId is required");
    }

    if (!data.contentType) {
        throw new Error("contentType is required");
    }

    if (!CONTENT_TYPES.includes(data.contentType)) {
        throw new Error("Invalid contentType");
    }

    if (!data.contentId) {
        throw new Error("contentId is required");
    }

    if (!data.reason) {
        throw new Error("reason is required");
    }

    if (!REASONS.includes(data.reason)) {
        throw new Error("Invalid moderation reason");
    }

    if (
        data.priority &&
        !PRIORITIES.includes(data.priority)
    ) {
        throw new Error("Invalid moderation priority");
    }

    return true;
};


const validateModerationAction = (data) => {

    if (!data.action) {
        throw new Error("action is required");
    }

    if (!ACTIONS.includes(data.action)) {
        throw new Error("Invalid moderation action");
    }

    return true;
};


module.exports = {
    CONTENT_TYPES,
    REASONS,
    PRIORITIES,
    STATUSES,
    ACTIONS,
    validateCreateModeration,
    validateModerationAction
};

