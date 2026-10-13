const allowedRosterTypes = [
    "DAILY",
    "WEEKLY",
    "MONTHLY"
];

const allowedStatuses = [
    "SCHEDULED",
    "CONFIRMED",
    "CANCELLED",
    "COMPLETED"
];


const validateCreate = (data) => {

    const requiredFields = [
        "societyId",
        "staffId",
        "shiftId",
        "rosterDate"
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
        data.rosterType &&
        !allowedRosterTypes.includes(
            data.rosterType
        )
    ) {
        throw new Error(
            "Invalid rosterType"
        );
    }

    if (
        data.status &&
        !allowedStatuses.includes(
            data.status
        )
    ) {
        throw new Error(
            "Invalid roster status"
        );
    }

    return true;
};


const validateUpdate = (data) => {

    if (
        data.rosterType &&
        !allowedRosterTypes.includes(
            data.rosterType
        )
    ) {
        throw new Error(
            "Invalid rosterType"
        );
    }

    if (
        data.status &&
        !allowedStatuses.includes(
            data.status
        )
    ) {
        throw new Error(
            "Invalid roster status"
        );
    }

    return true;
};


module.exports = {
    allowedRosterTypes,
    allowedStatuses,
    validateCreate,
    validateUpdate
};