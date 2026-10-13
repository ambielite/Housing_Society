const validateDateRange = (req, res, next) => {
    const { societyId, fromDate, toDate } = req.query;

    if (!societyId) {
        return res.status(400).json({
            success: false,
            message: "societyId is required"
        });
    }

    if (!fromDate) {
        return res.status(400).json({
            success: false,
            message: "fromDate is required"
        });
    }

    if (!toDate) {
        return res.status(400).json({
            success: false,
            message: "toDate is required"
        });
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
            success: false,
            message: "Invalid date format"
        });
    }

    if (start > end) {
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