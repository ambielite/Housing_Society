const allowedTaskTypes = [
    "SECURITY",
    "MAID",
    "HOUSEKEEPING",
    "MAINTENANCE",
    "INSPECTION",
    "PATROL",
    "EMERGENCY",
    "OTHER"
];

const allowedPriorities = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "URGENT"
];

const allowedStatuses = [
    "ASSIGNED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "OVERDUE"
];

const validateCreate = (data) => {

    const requiredFields = [
        "societyId",
        "staffId",
        "title"
    ];

    for (const field of requiredFields) {

        if (
            data[field] === undefined ||
            data[field] === null ||
            data[field] === ""
        ) {
            throw new Error(`${field} is required`);
        }
    }

    if (
        data.taskType &&
        !allowedTaskTypes.includes(data.taskType)
    ) {
        throw new Error("Invalid taskType");
    }

    if (
        data.priority &&
        !allowedPriorities.includes(data.priority)
    ) {
        throw new Error("Invalid priority");
    }

    if (
        data.status &&
        !allowedStatuses.includes(data.status)
    ) {
        throw new Error("Invalid task status");
    }

    return true;
};


const validateUpdate = (data) => {

    if (
        data.taskType &&
        !allowedTaskTypes.includes(data.taskType)
    ) {
        throw new Error("Invalid taskType");
    }

    if (
        data.priority &&
        !allowedPriorities.includes(data.priority)
    ) {
        throw new Error("Invalid priority");
    }

    if (
        data.status &&
        !allowedStatuses.includes(data.status)
    ) {
        throw new Error("Invalid task status");
    }

    return true;
};


module.exports = {
    allowedTaskTypes,
    allowedPriorities,
    allowedStatuses,
    validateCreate,
    validateUpdate
};
