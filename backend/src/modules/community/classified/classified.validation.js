const CATEGORIES = [
    "FOR_SALE",
    "FOR_RENT",
    "WANTED",
    "SERVICES",
    "FREE"
];

const STATUSES = [
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "REJECTED",
    "PUBLISHED",
    "SOLD",
    "EXPIRED",
    "REMOVED"
];

const validateCreateClassified = (data) => {
    if (!data.societyId) {
        throw new Error("societyId is required");
    }

    if (!data.sellerId) {
        throw new Error("sellerId is required");
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

    if (!CATEGORIES.includes(data.category)) {
        throw new Error("Invalid classified category");
    }

    if (
        data.price !== undefined &&
        data.price !== null &&
        Number(data.price) < 0
    ) {
        throw new Error("price cannot be negative");
    }

    if (
        data.images !== undefined &&
        !Array.isArray(data.images)
    ) {
        throw new Error("images must be an array");
    }

    return true;
};

const validateUpdateClassified = (data) => {
    if (
        data.category &&
        !CATEGORIES.includes(data.category)
    ) {
        throw new Error("Invalid classified category");
    }

    if (
        data.price !== undefined &&
        data.price !== null &&
        Number(data.price) < 0
    ) {
        throw new Error("price cannot be negative");
    }

    if (
        data.images !== undefined &&
        !Array.isArray(data.images)
    ) {
        throw new Error("images must be an array");
    }

    return true;
};

const validateApproval = (data) => {
    if (!data.moderatorId) {
        throw new Error("moderatorId is required");
    }

    return true;
};

const validateRejection = (data) => {
    if (!data.moderatorId) {
        throw new Error("moderatorId is required");
    }

    if (!data.moderationNote) {
        throw new Error("moderationNote is required");
    }

    return true;
};

module.exports = {
    CATEGORIES,
    STATUSES,
    validateCreateClassified,
    validateUpdateClassified,
    validateApproval,
    validateRejection
};