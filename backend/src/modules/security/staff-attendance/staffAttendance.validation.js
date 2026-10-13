const allowedStatuses = [
    "PRESENT",
    "ABSENT",
    "LATE",
    "HALF_DAY",
    "ON_LEAVE"
];


const validateCreate = (data) => {

    const requiredFields = [
        "staffId",
        "attendanceDate"
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
        !allowedStatuses.includes(
            data.status
        )
    ) {
        throw new Error(
            "Invalid attendance status"
        );
    }

    if (
        data.workingMinutes !== undefined &&
        data.workingMinutes !== null &&
        data.workingMinutes < 0
    ) {
        throw new Error(
            "workingMinutes cannot be negative"
        );
    }

    if (
        data.overtimeMinutes !== undefined &&
        data.overtimeMinutes !== null &&
        data.overtimeMinutes < 0
    ) {
        throw new Error(
            "overtimeMinutes cannot be negative"
        );
    }

    return true;
};


const validateUpdate = (data) => {

    if (
        data.status &&
        !allowedStatuses.includes(
            data.status
        )
    ) {
        throw new Error(
            "Invalid attendance status"
        );
    }

    if (
        data.workingMinutes !== undefined &&
        data.workingMinutes !== null &&
        data.workingMinutes < 0
    ) {
        throw new Error(
            "workingMinutes cannot be negative"
        );
    }

    if (
        data.overtimeMinutes !== undefined &&
        data.overtimeMinutes !== null &&
        data.overtimeMinutes < 0
    ) {
        throw new Error(
            "overtimeMinutes cannot be negative"
        );
    }

    return true;
};


module.exports = {
    allowedStatuses,
    validateCreate,
    validateUpdate
};