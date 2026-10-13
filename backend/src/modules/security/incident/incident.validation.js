const validateCreateIncident = (data) => {

    const errors = [];

    if (!data.societyId) {
        errors.push("societyId is required");
    }

    if (!data.incidentNumber) {
        errors.push("incidentNumber is required");
    }

    if (!data.incidentType) {
        errors.push("incidentType is required");
    }

    if (!data.title) {
        errors.push("title is required");
    }

    if (!data.description) {
        errors.push("description is required");
    }

    if (!data.incidentDate) {
        errors.push("incidentDate is required");
    }

    const allowedTypes = [
        "SECURITY_BREACH",
        "THEFT",
        "FIRE",
        "MEDICAL",
        "ACCIDENT",
        "FIGHT",
        "VANDALISM",
        "UNAUTHORIZED_ACCESS",
        "VEHICLE",
        "PROPERTY_DAMAGE",
        "SAFETY_HAZARD",
        "OTHER"
    ];

    if (
        data.incidentType &&
        !allowedTypes.includes(data.incidentType)
    ) {
        errors.push("Invalid incidentType");
    }

    const allowedSeverities = [
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL"
    ];

    if (
        data.severity &&
        !allowedSeverities.includes(data.severity)
    ) {
        errors.push("Invalid severity");
    }

    const allowedPriorities = [
        "LOW",
        "MEDIUM",
        "HIGH",
        "URGENT"
    ];

    if (
        data.priority &&
        !allowedPriorities.includes(data.priority)
    ) {
        errors.push("Invalid priority");
    }

    return errors;
};

module.exports = {
    validateCreateIncident
};