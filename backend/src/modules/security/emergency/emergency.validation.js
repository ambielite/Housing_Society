const validateCreateEmergency = (data) => {

    const errors = [];


    if (!data.societyId) {
        errors.push("societyId is required");
    }


    if (!data.emergencyNumber) {
        errors.push("emergencyNumber is required");
    }


    if (!data.emergencyType) {
        errors.push("emergencyType is required");
    }


    if (!data.title) {
        errors.push("title is required");
    }


    if (!data.description) {
        errors.push("description is required");
    }


    const allowedTypes = [
        "FIRE",
        "MEDICAL",
        "SECURITY_BREACH",
        "THEFT",
        "ACCIDENT",
        "ELECTRICAL",
        "WATER_LEAKAGE",
        "FLOOD",
        "GAS_LEAK",
        "MISSING_PERSON",
        "NATURAL_DISASTER",
        "VIOLENCE",
        "OTHER"
    ];


    if (
        data.emergencyType &&
        !allowedTypes.includes(data.emergencyType)
    ) {
        errors.push(
            "Invalid emergencyType"
        );
    }


    const allowedPriorities = [
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL"
    ];


    if (
        data.priority &&
        !allowedPriorities.includes(data.priority)
    ) {
        errors.push(
            "Invalid priority"
        );
    }


    return errors;
};


module.exports = {
    validateCreateEmergency
};