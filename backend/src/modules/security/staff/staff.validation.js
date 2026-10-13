const validateCreateStaff = (data) => {

    const requiredFields = [
        "societyId",
        "employeeCode",
        "firstName",
        "mobileNumber",
        "joiningDate",
        "staffType"
    ];

    for (const field of requiredFields) {

        if (
            data[field] === undefined ||
            data[field] === null ||
            data[field] === ""
        ) {
            return `${field} is required`;
        }
    }

    return null;
};


const validateStaffType = (staffType) => {

    const allowedTypes = [
        "SECURITY_GUARD",
        "SECURITY_SUPERVISOR",
        "HOUSEKEEPING",
        "MAINTENANCE",
        "ELECTRICIAN",
        "PLUMBER",
        "GARDENER",
        "OTHER"
    ];

    if (!allowedTypes.includes(staffType)) {
        return "Invalid staffType";
    }

    return null;
};


module.exports = {
    validateCreateStaff,
    validateStaffType
};