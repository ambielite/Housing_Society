const allowedStatuses = [
    "SCHEDULED",
    "IN_PROGRESS",
    "COMPLETED",
    "MISSED",
    "CANCELLED"
];


const validateCreate = (data) => {

    const requiredFields = [
        "societyId",
        "staffId",
        "patrolCode",
        "patrolName",
        "patrolDate",
        "plannedStartTime",
        "plannedEndTime"
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
        data.status &&
        !allowedStatuses.includes(data.status)
    ) {

        throw new Error(
            "Invalid patrol status"
        );

    }


    return true;
};


const validateUpdate = (data) => {

    if (
        data.status &&
        !allowedStatuses.includes(data.status)
    ) {

        throw new Error(
            "Invalid patrol status"
        );

    }


    return true;
};


module.exports = {
    allowedStatuses,
    validateCreate,
    validateUpdate
};