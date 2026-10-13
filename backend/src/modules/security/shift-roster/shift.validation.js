const allowedShiftTypes = [
    "MORNING",
    "AFTERNOON",
    "EVENING",
    "NIGHT",
    "GENERAL",
    "OTHER"
];

const allowedStatuses = [
    "ACTIVE",
    "INACTIVE"
];


const validateCreate = (data) => {

    const requiredFields = [
        "societyId",
        "shiftCode",
        "shiftName",
        "startTime",
        "endTime"
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
        data.shiftType &&
        !allowedShiftTypes.includes(
            data.shiftType
        )
    ) {
        throw new Error(
            "Invalid shiftType"
        );
    }

    if (
        data.status &&
        !allowedStatuses.includes(
            data.status
        )
    ) {
        throw new Error(
            "Invalid shift status"
        );
    }

    if (
        data.breakMinutes !== undefined &&
        data.breakMinutes < 0
    ) {
        throw new Error(
            "breakMinutes cannot be negative"
        );
    }

    if (
        data.graceMinutes !== undefined &&
        data.graceMinutes < 0
    ) {
        throw new Error(
            "graceMinutes cannot be negative"
        );
    }

    return true;
};


const validateUpdate = (data) => {

    if (
        data.shiftType &&
        !allowedShiftTypes.includes(
            data.shiftType
        )
    ) {
        throw new Error(
            "Invalid shiftType"
        );
    }

    if (
        data.status &&
        !allowedStatuses.includes(
            data.status
        )
    ) {
        throw new Error(
            "Invalid shift status"
        );
    }

    if (
        data.breakMinutes !== undefined &&
        data.breakMinutes < 0
    ) {
        throw new Error(
            "breakMinutes cannot be negative"
        );
    }

    if (
        data.graceMinutes !== undefined &&
        data.graceMinutes < 0
    ) {
        throw new Error(
            "graceMinutes cannot be negative"
        );
    }

    return true;
};


module.exports = {
    allowedShiftTypes,
    allowedStatuses,
    validateCreate,
    validateUpdate
};