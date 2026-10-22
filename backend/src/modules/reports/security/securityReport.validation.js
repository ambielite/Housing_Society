const validateDateRange = (req, res, next) => {
    const { societyId, fromDate, toDate } = req.query;

    if (!societyId) {
        return res.status(400).json({
            success: false,
            message: "societyId is required"
        });
    }

    const start = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const end = toDate ? new Date(`${toDate}T00:00:00`) : null;

    if ((fromDate && Number.isNaN(start.getTime())) || (toDate && Number.isNaN(end.getTime()))) {
        return res.status(400).json({
            success: false,
            message: "Invalid date format"
        });
    }

    if (start && end && start > end) {
        return res.status(400).json({
            success: false,
            message: "fromDate cannot be greater than toDate"
        });
    }

    next();
};

module.exports = {
    validateDateRange
};
