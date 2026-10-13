const validateCreateAudit = (data) => {

    const errors = [];


    if (!data.societyId) {
        errors.push(
            "societyId is required"
        );
    }


    if (!data.action) {
        errors.push(
            "action is required"
        );
    }


    if (!data.module) {
        errors.push(
            "module is required"
        );
    }


    const allowedActions = [
        "CREATE",
        "UPDATE",
        "DELETE",
        "VIEW",
        "LOGIN",
        "LOGOUT",
        "APPROVE",
        "REJECT",
        "ASSIGN",
        "UNASSIGN",
        "START",
        "COMPLETE",
        "CANCEL",
        "VERIFY",
        "ACKNOWLEDGE",
        "RESOLVE",
        "CLOSE",
        "TRIGGER",
        "OTHER"
    ];


    if (
        data.action &&
        !allowedActions.includes(
            data.action
        )
    ) {
        errors.push(
            "Invalid action"
        );
    }


    const allowedModules = [
        "STAFF",
        "STAFF_DOCUMENT",
        "STAFF_UNIT_MAPPING",
        "STAFF_ATTENDANCE",
        "SHIFT",
        "ROSTER",
        "STAFF_TASK",
        "CHECKPOINT",
        "PATROL",
        "INCIDENT",
        "EMERGENCY",
        "SECURITY_AUDIT",
        "OTHER"
    ];


    if (
        data.module &&
        !allowedModules.includes(
            data.module
        )
    ) {
        errors.push(
            "Invalid module"
        );
    }


    const allowedSeverity = [
        "INFO",
        "WARNING",
        "CRITICAL"
    ];


    if (
        data.severity &&
        !allowedSeverity.includes(
            data.severity
        )
    ) {
        errors.push(
            "Invalid severity"
        );
    }


    return errors;
};


module.exports = {
    validateCreateAudit
};