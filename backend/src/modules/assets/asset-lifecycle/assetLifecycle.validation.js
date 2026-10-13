
const {
    validate: isUUID
} = require("uuid");


const allowedLifecycleTypes = [
    "WARRANTY_EXPIRY",
    "AMC_EXPIRY",
    "MAINTENANCE_DUE",
    "LOW_STOCK",
    "RETIREMENT",
    "DISPOSAL"
];


const allowedStatuses = [
    "PENDING",
    "SENT",
    "ACKNOWLEDGED",
    "COMPLETED",
    "CANCELLED",
    "EXPIRED"
];


const allowedPriorities = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL"
];


const allowedNotificationTypes = [
    "SYSTEM",
    "EMAIL",
    "SMS",
    "PUSH"
];


const isValidUUID = (value) => {

    return (
        typeof value === "string" &&
        value.trim() !== "" &&
        isUUID(value)
    );
};


const isValidDate = (value) => {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return true;
    }

    const date = new Date(value);

    return !Number.isNaN(
        date.getTime()
    );
};


const validateCreateLifecycle = (
    data
) => {

    const errors = [];


    if (!data.societyId) {

        errors.push(
            "societyId is required"
        );

    } else if (
        !isValidUUID(
            data.societyId
        )
    ) {

        errors.push(
            "societyId must be a valid UUID"
        );
    }


    if (!data.assetId) {

        errors.push(
            "assetId is required"
        );

    } else if (
        !isValidUUID(
            data.assetId
        )
    ) {

        errors.push(
            "assetId must be a valid UUID"
        );
    }


    if (!data.lifecycleType) {

        errors.push(
            "lifecycleType is required"
        );

    } else if (
        !allowedLifecycleTypes.includes(
            data.lifecycleType
        )
    ) {

        errors.push(
            `Invalid lifecycleType. Allowed values: ${allowedLifecycleTypes.join(", ")}`
        );
    }


    if (!data.title) {

        errors.push(
            "title is required"
        );
    }


    if (
        !isValidDate(
            data.dueDate
        )
    ) {

        errors.push(
            "dueDate must be a valid date"
        );
    }


    if (
        !isValidDate(
            data.reminderDate
        )
    ) {

        errors.push(
            "reminderDate must be a valid date"
        );
    }


    if (
        data.reminderDaysBefore !==
        undefined
    ) {

        if (
            Number.isNaN(
                Number(
                    data.reminderDaysBefore
                )
            ) ||
            Number(
                data.reminderDaysBefore
            ) < 0
        ) {

            errors.push(
                "reminderDaysBefore must be a non-negative number"
            );
        }
    }


    if (
        data.status &&
        !allowedStatuses.includes(
            data.status
        )
    ) {

        errors.push(
            `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`
        );
    }


    if (
        data.priority &&
        !allowedPriorities.includes(
            data.priority
        )
    ) {

        errors.push(
            `Invalid priority. Allowed values: ${allowedPriorities.join(", ")}`
        );
    }


    if (
        data.notificationType &&
        !allowedNotificationTypes.includes(
            data.notificationType
        )
    ) {

        errors.push(
            `Invalid notificationType. Allowed values: ${allowedNotificationTypes.join(", ")}`
        );
    }


    if (
        data.disposalValue !==
        undefined &&
        (
            Number.isNaN(
                Number(
                    data.disposalValue
                )
            ) ||
            Number(
                data.disposalValue
            ) < 0
        )
    ) {

        errors.push(
            "disposalValue must be a valid non-negative number"
        );
    }


    return errors;
};


module.exports = {
    validateCreateLifecycle,
    allowedLifecycleTypes,
    allowedStatuses,
    allowedPriorities,
    allowedNotificationTypes
};

