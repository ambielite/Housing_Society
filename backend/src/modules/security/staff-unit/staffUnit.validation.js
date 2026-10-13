const allowedAssignmentTypes = [
    "HOUSEKEEPING",
    "MAINTENANCE",
    "SECURITY",
    "SUPPORT",
    "OTHER"
];

const allowedStatuses = [
    "ACTIVE",
    "INACTIVE",
    "COMPLETED",
    "CANCELLED"
];

const validateCreate = (data) => {

    const requiredFields = [
        "staffId",
        "unitId",
        "assignmentType",
        "startDate"
    ];

    for (const field of requiredFields) {

        if (
            data[field] === undefined ||
            data[field] === null ||
            data[field] === ""
        ) {
            throw new Error(
                `${field} is required`
            );
        }
    }

    if (
        !allowedAssignmentTypes.includes(
            data.assignmentType
        )
    ) {
        throw new Error(
            "Invalid assignmentType"
        );
    }

    if (
        data.endDate &&
        data.endDate < data.startDate
    ) {
        throw new Error(
            "endDate cannot be before startDate"
        );
    }

    if (
        data.status &&
        !allowedStatuses.includes(data.status)
    ) {
        throw new Error(
            "Invalid status"
        );
    }

    return true;
};

const validateUpdate = (data) => {

    if (
        data.assignmentType &&
        !allowedAssignmentTypes.includes(
            data.assignmentType
        )
    ) {
        throw new Error(
            "Invalid assignmentType"
        );
    }

    if (
        data.status &&
        !allowedStatuses.includes(data.status)
    ) {
        throw new Error(
            "Invalid status"
        );
    }

    if (
        data.startDate &&
        data.endDate &&
        data.endDate < data.startDate
    ) {
        throw new Error(
            "endDate cannot be before startDate"
        );
    }

    return true;
};

module.exports = {
    allowedAssignmentTypes,
    allowedStatuses,
    validateCreate,
    validateUpdate
};