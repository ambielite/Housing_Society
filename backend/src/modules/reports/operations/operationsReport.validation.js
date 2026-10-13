const validateSocietyId = (societyId) => {

    if (!societyId) {
        throw new Error("societyId is required");
    }

    return true;
};


const validateDateRange = (fromDate, toDate) => {

    if (!fromDate && !toDate) {
        return true;
    }


    if (fromDate) {

        const from =
            new Date(fromDate);

        if (Number.isNaN(from.getTime())) {
            throw new Error("Invalid fromDate");
        }
    }


    if (toDate) {

        const to =
            new Date(toDate);

        if (Number.isNaN(to.getTime())) {
            throw new Error("Invalid toDate");
        }
    }


    if (fromDate && toDate) {

        const from =
            new Date(fromDate);

        const to =
            new Date(toDate);


        if (from > to) {
            throw new Error(
                "fromDate cannot be greater than toDate"
            );
        }
    }


    return true;
};


module.exports = {
    validateSocietyId,
    validateDateRange
};