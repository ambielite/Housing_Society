
const validateDashboardRequest = (data) => {

    if (!data.societyId) {
        throw new Error("societyId is required");
    }

    return true;
};


const validateDateRange = (data) => {

    if (data.fromDate && data.toDate) {

        const fromDate =
            new Date(data.fromDate);

        const toDate =
            new Date(data.toDate);

        if (Number.isNaN(fromDate.getTime())) {
            throw new Error("Invalid fromDate");
        }

        if (Number.isNaN(toDate.getTime())) {
            throw new Error("Invalid toDate");
        }

        if (fromDate > toDate) {
            throw new Error(
                "fromDate cannot be greater than toDate"
            );
        }
    }

    return true;
};


module.exports = {
    validateDashboardRequest,
    validateDateRange
};

