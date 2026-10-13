const PERIOD_STATUSES = [
    "OPEN",
    "CLOSED",
    "LOCKED"
];


const validateCreatePeriod = (data) => {

    const errors = [];

    if (!data.societyId) {
        errors.push(
            "societyId is required"
        );
    }

    if (!data.name) {
        errors.push(
            "name is required"
        );
    }

    if (!data.startDate) {
        errors.push(
            "startDate is required"
        );
    }

    if (!data.endDate) {
        errors.push(
            "endDate is required"
        );
    }

    if (
        data.startDate &&
        data.endDate &&
        data.startDate > data.endDate
    ) {

        errors.push(
            "startDate cannot be greater than endDate"
        );

    }

    if (
        data.status &&
        !PERIOD_STATUSES.includes(data.status)
    ) {

        errors.push(
            `status must be one of: ${PERIOD_STATUSES.join(", ")}`
        );

    }

    return errors;

};


module.exports = {

    PERIOD_STATUSES,
    validateCreatePeriod

};