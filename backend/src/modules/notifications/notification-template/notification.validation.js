
const { validate: validateUUID } = require("uuid");


// ============================================================
// NOTIFICATION TEMPLATE
// ============================================================

const CHANNELS = [
    "IN_APP",
    "EMAIL",
    "SMS",
    "WHATSAPP"
];

const STATUSES = [
    "ACTIVE",
    "INACTIVE"
];


// ------------------------------------------------------------
// CREATE NOTIFICATION TEMPLATE
// ------------------------------------------------------------

const validateCreateTemplate = (data) => {

    const errors = [];

    if (
        data.societyId &&
        !validateUUID(data.societyId)
    ) {
        errors.push(
            "Invalid societyId"
        );
    }

    if (
        !data.templateCode ||
        typeof data.templateCode !== "string"
    ) {
        errors.push(
            "templateCode is required"
        );
    }

    if (
        !data.templateName ||
        typeof data.templateName !== "string"
    ) {
        errors.push(
            "templateName is required"
        );
    }

    if (
        !data.channel ||
        !CHANNELS.includes(data.channel)
    ) {
        errors.push(
            `channel must be one of: ${CHANNELS.join(", ")}`
        );
    }

    if (
        !data.messageTemplate ||
        typeof data.messageTemplate !== "string"
    ) {
        errors.push(
            "messageTemplate is required"
        );
    }

    if (
        data.status &&
        !STATUSES.includes(data.status)
    ) {
        errors.push(
            `status must be one of: ${STATUSES.join(", ")}`
        );
    }

    if (
        data.variables !== undefined &&
        !Array.isArray(data.variables)
    ) {
        errors.push(
            "variables must be an array"
        );
    }

    return errors;
};


// ------------------------------------------------------------
// UPDATE NOTIFICATION TEMPLATE
// ------------------------------------------------------------

const validateUpdateTemplate = (data) => {

    const errors = [];

    if (
        data.societyId &&
        !validateUUID(data.societyId)
    ) {
        errors.push(
            "Invalid societyId"
        );
    }

    if (
        data.channel &&
        !CHANNELS.includes(data.channel)
    ) {
        errors.push(
            `channel must be one of: ${CHANNELS.join(", ")}`
        );
    }

    if (
        data.status &&
        !STATUSES.includes(data.status)
    ) {
        errors.push(
            `status must be one of: ${STATUSES.join(", ")}`
        );
    }

    if (
        data.variables !== undefined &&
        !Array.isArray(data.variables)
    ) {
        errors.push(
            "variables must be an array"
        );
    }

    return errors;
};


// ============================================================
// COMMON ID VALIDATION
// ============================================================

const validateId = (id) => {

    return validateUUID(id);
};


// ============================================================
// NOTIFICATION PREFERENCE
// ============================================================

const PREFERENCE_CHANNELS = [
    "IN_APP",
    "EMAIL",
    "SMS",
    "WHATSAPP"
];


// ------------------------------------------------------------
// CREATE NOTIFICATION PREFERENCE
// ------------------------------------------------------------

const validateCreatePreference = (data) => {

    const errors = [];

    if (
        !data.societyId ||
        !validateUUID(data.societyId)
    ) {
        errors.push(
            "Valid societyId is required"
        );
    }

    if (
        !data.userId ||
        !validateUUID(data.userId)
    ) {
        errors.push(
            "Valid userId is required"
        );
    }

    if (
        !data.channel ||
        !PREFERENCE_CHANNELS.includes(
            data.channel
        )
    ) {
        errors.push(
            `channel must be one of: ${PREFERENCE_CHANNELS.join(", ")}`
        );
    }

    if (
        data.enabled !== undefined &&
        typeof data.enabled !== "boolean"
    ) {
        errors.push(
            "enabled must be true or false"
        );
    }

    if (
        data.allowMarketing !== undefined &&
        typeof data.allowMarketing !== "boolean"
    ) {
        errors.push(
            "allowMarketing must be true or false"
        );
    }

    if (
        data.allowOperational !== undefined &&
        typeof data.allowOperational !== "boolean"
    ) {
        errors.push(
            "allowOperational must be true or false"
        );
    }

    if (
        data.allowEmergency !== undefined &&
        typeof data.allowEmergency !== "boolean"
    ) {
        errors.push(
            "allowEmergency must be true or false"
        );
    }

    return errors;
};


// ------------------------------------------------------------
// UPDATE NOTIFICATION PREFERENCE
// ------------------------------------------------------------

const validateUpdatePreference = (data) => {

    const errors = [];

    if (
        data.enabled !== undefined &&
        typeof data.enabled !== "boolean"
    ) {
        errors.push(
            "enabled must be true or false"
        );
    }

    if (
        data.allowMarketing !== undefined &&
        typeof data.allowMarketing !== "boolean"
    ) {
        errors.push(
            "allowMarketing must be true or false"
        );
    }

    if (
        data.allowOperational !== undefined &&
        typeof data.allowOperational !== "boolean"
    ) {
        errors.push(
            "allowOperational must be true or false"
        );
    }

    if (
        data.allowEmergency !== undefined &&
        typeof data.allowEmergency !== "boolean"
    ) {
        errors.push(
            "allowEmergency must be true or false"
        );
    }

    return errors;
};


// ============================================================
// NOTIFICATION MANAGEMENT
// 14.3
// ============================================================

const NOTIFICATION_TYPES = [
    "OPERATIONAL",
    "MARKETING",
    "EMERGENCY"
];

const NOTIFICATION_STATUSES = [
    "PENDING",
    "PROCESSING",
    "SENT",
    "DELIVERED",
    "FAILED",
    "CANCELLED"
];

const NOTIFICATION_PRIORITIES = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL"
];


// ------------------------------------------------------------
// CREATE NOTIFICATION
// ------------------------------------------------------------

const validateCreateNotification = (data) => {

    const errors = [];

    // Society
    if (
        !data.societyId ||
        !validateUUID(data.societyId)
    ) {
        errors.push(
            "Valid societyId is required"
        );
    }


    // User
    if (
        !data.userId ||
        !validateUUID(data.userId)
    ) {
        errors.push(
            "Valid userId is required"
        );
    }


    // Template
    if (
        data.templateId &&
        !validateUUID(data.templateId)
    ) {
        errors.push(
            "Invalid templateId"
        );
    }


    // Channel
    if (
        !data.channel ||
        !CHANNELS.includes(data.channel)
    ) {
        errors.push(
            `channel must be one of: ${CHANNELS.join(", ")}`
        );
    }


    // Notification Type
    if (
        data.notificationType &&
        !NOTIFICATION_TYPES.includes(
            data.notificationType
        )
    ) {
        errors.push(
            `notificationType must be one of: ${NOTIFICATION_TYPES.join(", ")}`
        );
    }


    // Message
    if (
        !data.message ||
        typeof data.message !== "string" ||
        data.message.trim() === ""
    ) {
        errors.push(
            "message is required"
        );
    }


    // Priority
    if (
        data.priority &&
        !NOTIFICATION_PRIORITIES.includes(
            data.priority
        )
    ) {
        errors.push(
            `priority must be one of: ${NOTIFICATION_PRIORITIES.join(", ")}`
        );
    }


    // Status
    if (
        data.status &&
        !NOTIFICATION_STATUSES.includes(
            data.status
        )
    ) {
        errors.push(
            `status must be one of: ${NOTIFICATION_STATUSES.join(", ")}`
        );
    }


    // Scheduled At
    if (
        data.scheduledAt &&
        isNaN(Date.parse(data.scheduledAt))
    ) {
        errors.push(
            "Invalid scheduledAt"
        );
    }


    // Data
    if (
        data.data !== undefined &&
        (
            typeof data.data !== "object" ||
            data.data === null ||
            Array.isArray(data.data)
        )
    ) {
        errors.push(
            "data must be a valid object"
        );
    }


    // Reference ID
    if (
        data.referenceId &&
        !validateUUID(data.referenceId)
    ) {
        errors.push(
            "Invalid referenceId"
        );
    }


    return errors;
};


// ------------------------------------------------------------
// UPDATE NOTIFICATION
// ------------------------------------------------------------

const validateUpdateNotification = (data) => {

    const errors = [];

    // Channel
    if (
        data.channel &&
        !CHANNELS.includes(data.channel)
    ) {
        errors.push(
            `channel must be one of: ${CHANNELS.join(", ")}`
        );
    }


    // Notification Type
    if (
        data.notificationType &&
        !NOTIFICATION_TYPES.includes(
            data.notificationType
        )
    ) {
        errors.push(
            `notificationType must be one of: ${NOTIFICATION_TYPES.join(", ")}`
        );
    }


    // Priority
    if (
        data.priority &&
        !NOTIFICATION_PRIORITIES.includes(
            data.priority
        )
    ) {
        errors.push(
            `priority must be one of: ${NOTIFICATION_PRIORITIES.join(", ")}`
        );
    }


    // Status
    if (
        data.status &&
        !NOTIFICATION_STATUSES.includes(
            data.status
        )
    ) {
        errors.push(
            `status must be one of: ${NOTIFICATION_STATUSES.join(", ")}`
        );
    }


    // Message
    if (
        data.message !== undefined &&
        (
            typeof data.message !== "string" ||
            data.message.trim() === ""
        )
    ) {
        errors.push(
            "message must be a valid string"
        );
    }


    // Scheduled At
    if (
        data.scheduledAt &&
        isNaN(Date.parse(data.scheduledAt))
    ) {
        errors.push(
            "Invalid scheduledAt"
        );
    }


    // Data
    if (
        data.data !== undefined &&
        (
            typeof data.data !== "object" ||
            data.data === null ||
            Array.isArray(data.data)
        )
    ) {
        errors.push(
            "data must be a valid object"
        );
    }


    // Reference ID
    if (
        data.referenceId &&
        !validateUUID(data.referenceId)
    ) {
        errors.push(
            "Invalid referenceId"
        );
    }


    return errors;
};


// ============================================================
// BROADCAST / NOTICE

// ============================================================

const BROADCAST_TYPES = [
    "NOTICE",
    "ANNOUNCEMENT",
    "ALERT",
    "EMERGENCY"
];

const AUDIENCE_TYPES = [
    "SOCIETY",
    "TOWER",
    "USERS"
];

const BROADCAST_CHANNELS = [
    "IN_APP",
    "EMAIL",
    "SMS",
    "WHATSAPP"
];

const BROADCAST_PRIORITIES = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL"
];

const BROADCAST_STATUSES = [
    "DRAFT",
    "SCHEDULED",
    "SENDING",
    "SENT",
    "CANCELLED",
    "FAILED"
];


// ------------------------------------------------------------
// CREATE BROADCAST
// ------------------------------------------------------------

const validateCreateBroadcast = (data) => {

    const errors = [];


    // Society
    if (
        !data.societyId ||
        !validateUUID(data.societyId)
    ) {
        errors.push(
            "Valid societyId is required"
        );
    }


    // Title
    if (
        !data.title ||
        typeof data.title !== "string" ||
        data.title.trim() === ""
    ) {
        errors.push(
            "title is required"
        );
    }


    // Message
    if (
        !data.message ||
        typeof data.message !== "string" ||
        data.message.trim() === ""
    ) {
        errors.push(
            "message is required"
        );
    }


    // Broadcast Type
    if (
        data.broadcastType &&
        !BROADCAST_TYPES.includes(
            data.broadcastType
        )
    ) {
        errors.push(
            `broadcastType must be one of: ${BROADCAST_TYPES.join(", ")}`
        );
    }


    // Audience Type
    if (
        data.audienceType &&
        !AUDIENCE_TYPES.includes(
            data.audienceType
        )
    ) {
        errors.push(
            `audienceType must be one of: ${AUDIENCE_TYPES.join(", ")}`
        );
    }


    // Audience IDs
    if (
        data.audienceIds !== undefined
    ) {

        if (
            !Array.isArray(data.audienceIds)
        ) {

            errors.push(
                "audienceIds must be an array"
            );

        } else {

            data.audienceIds.forEach(
                (id) => {

                    if (!validateUUID(id)) {

                        errors.push(
                            `Invalid audience ID: ${id}`
                        );
                    }
                }
            );
        }
    }


    // Channels
    if (
        data.channels !== undefined
    ) {

        if (
            !Array.isArray(data.channels)
        ) {

            errors.push(
                "channels must be an array"
            );

        } else {

            data.channels.forEach(
                (channel) => {

                    if (
                        !BROADCAST_CHANNELS.includes(
                            channel
                        )
                    ) {

                        errors.push(
                            `Invalid channel: ${channel}`
                        );
                    }
                }
            );
        }
    }


    // Priority
    if (
        data.priority &&
        !BROADCAST_PRIORITIES.includes(
            data.priority
        )
    ) {
        errors.push(
            `priority must be one of: ${BROADCAST_PRIORITIES.join(", ")}`
        );
    }


    // Status
    if (
        data.status &&
        !BROADCAST_STATUSES.includes(
            data.status
        )
    ) {
        errors.push(
            `status must be one of: ${BROADCAST_STATUSES.join(", ")}`
        );
    }


    // Scheduled At
    if (
        data.scheduledAt &&
        isNaN(Date.parse(data.scheduledAt))
    ) {
        errors.push(
            "Invalid scheduledAt"
        );
    }


    // Start At
    if (
        data.startAt &&
        isNaN(Date.parse(data.startAt))
    ) {
        errors.push(
            "Invalid startAt"
        );
    }


    // End At
    if (
        data.endAt &&
        isNaN(Date.parse(data.endAt))
    ) {
        errors.push(
            "Invalid endAt"
        );
    }


    // Attachments
    if (
        data.attachments !== undefined &&
        !Array.isArray(data.attachments)
    ) {
        errors.push(
            "attachments must be an array"
        );
    }


    // Data
    if (
        data.data !== undefined &&
        (
            typeof data.data !== "object" ||
            data.data === null ||
            Array.isArray(data.data)
        )
    ) {
        errors.push(
            "data must be a valid object"
        );
    }


    // Reference ID
    if (
        data.referenceId &&
        !validateUUID(data.referenceId)
    ) {
        errors.push(
            "Invalid referenceId"
        );
    }


    return errors;
};


// ------------------------------------------------------------
// UPDATE BROADCAST
// ------------------------------------------------------------

const validateUpdateBroadcast = (data) => {

    const errors = [];


    if (
        data.title !== undefined &&
        (
            typeof data.title !== "string" ||
            data.title.trim() === ""
        )
    ) {
        errors.push(
            "title must be a valid string"
        );
    }


    if (
        data.message !== undefined &&
        (
            typeof data.message !== "string" ||
            data.message.trim() === ""
        )
    ) {
        errors.push(
            "message must be a valid string"
        );
    }


    if (
        data.broadcastType &&
        !BROADCAST_TYPES.includes(
            data.broadcastType
        )
    ) {
        errors.push(
            `broadcastType must be one of: ${BROADCAST_TYPES.join(", ")}`
        );
    }


    if (
        data.audienceType &&
        !AUDIENCE_TYPES.includes(
            data.audienceType
        )
    ) {
        errors.push(
            `audienceType must be one of: ${AUDIENCE_TYPES.join(", ")}`
        );
    }


    if (
        data.audienceIds !== undefined
    ) {

        if (
            !Array.isArray(data.audienceIds)
        ) {

            errors.push(
                "audienceIds must be an array"
            );

        } else {

            data.audienceIds.forEach(
                (id) => {

                    if (!validateUUID(id)) {

                        errors.push(
                            `Invalid audience ID: ${id}`
                        );
                    }
                }
            );
        }
    }


    if (
        data.channels !== undefined
    ) {

        if (
            !Array.isArray(data.channels)
        ) {

            errors.push(
                "channels must be an array"
            );

        } else {

            data.channels.forEach(
                (channel) => {

                    if (
                        !BROADCAST_CHANNELS.includes(
                            channel
                        )
                    ) {

                        errors.push(
                            `Invalid channel: ${channel}`
                        );
                    }
                }
            );
        }
    }


    if (
        data.priority &&
        !BROADCAST_PRIORITIES.includes(
            data.priority
        )
    ) {
        errors.push(
            `priority must be one of: ${BROADCAST_PRIORITIES.join(", ")}`
        );
    }


    if (
        data.status &&
        !BROADCAST_STATUSES.includes(
            data.status
        )
    ) {
        errors.push(
            `status must be one of: ${BROADCAST_STATUSES.join(", ")}`
        );
    }


    if (
        data.scheduledAt &&
        isNaN(Date.parse(data.scheduledAt))
    ) {
        errors.push(
            "Invalid scheduledAt"
        );
    }


    if (
        data.startAt &&
        isNaN(Date.parse(data.startAt))
    ) {
        errors.push(
            "Invalid startAt"
        );
    }


    if (
        data.endAt &&
        isNaN(Date.parse(data.endAt))
    ) {
        errors.push(
            "Invalid endAt"
        );
    }


    if (
        data.attachments !== undefined &&
        !Array.isArray(data.attachments)
    ) {
        errors.push(
            "attachments must be an array"
        );
    }


    if (
        data.data !== undefined &&
        (
            typeof data.data !== "object" ||
            data.data === null ||
            Array.isArray(data.data)
        )
    ) {
        errors.push(
            "data must be a valid object"
        );
    }


    if (
        data.referenceId &&
        !validateUUID(data.referenceId)
    ) {
        errors.push(
            "Invalid referenceId"
        );
    }


    return errors;
};




// ============================================================
// EXPORTS
// ============================================================

module.exports = {

    // --------------------------------------------------------
    // Notification Template
    // --------------------------------------------------------

    validateCreateTemplate,
    validateUpdateTemplate,


    // --------------------------------------------------------
    // Common
    // --------------------------------------------------------

    validateId,


    // --------------------------------------------------------
    // Template Constants
    // --------------------------------------------------------

    CHANNELS,
    STATUSES,


    // --------------------------------------------------------
    // Notification Preference
    // --------------------------------------------------------

    validateCreatePreference,
    validateUpdatePreference,
    PREFERENCE_CHANNELS,


    // --------------------------------------------------------
    // Notification
    // --------------------------------------------------------

    validateCreateNotification,
    validateUpdateNotification,

    NOTIFICATION_TYPES,
    NOTIFICATION_STATUSES,
    NOTIFICATION_PRIORITIES,

    // --------------------------------------------------------
    // Broadcast
    // --------------------------------------------------------

    validateCreateBroadcast,
    validateUpdateBroadcast,

    BROADCAST_TYPES,
    AUDIENCE_TYPES,
    BROADCAST_CHANNELS,
    BROADCAST_PRIORITIES,
    BROADCAST_STATUSES


};

