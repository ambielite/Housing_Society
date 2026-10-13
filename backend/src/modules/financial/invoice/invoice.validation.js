const validateCreateInvoice = (
    req,
    res,
    next
) => {

    const {
        societyId,
        unitId,
        invoiceNumber,
        billingPeriod,
        invoiceDate,
        dueDate,
        idempotencyKey
    } = req.body;

    if (!societyId) {
        return res.status(400).json({
            success: false,
            message:
                "societyId is required"
        });
    }

    if (!unitId) {
        return res.status(400).json({
            success: false,
            message:
                "unitId is required"
        });
    }

    if (!invoiceNumber) {
        return res.status(400).json({
            success: false,
            message:
                "invoiceNumber is required"
        });
    }

    if (!billingPeriod) {
        return res.status(400).json({
            success: false,
            message:
                "billingPeriod is required"
        });
    }

    if (!invoiceDate) {
        return res.status(400).json({
            success: false,
            message:
                "invoiceDate is required"
        });
    }

    if (!dueDate) {
        return res.status(400).json({
            success: false,
            message:
                "dueDate is required"
        });
    }

    if (!idempotencyKey) {
        return res.status(400).json({
            success: false,
            message:
                "idempotencyKey is required"
        });
    }

    if (
        new Date(invoiceDate) >
        new Date(dueDate)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "invoiceDate cannot be greater than dueDate"
        });
    }

    next();
};

module.exports = {
    validateCreateInvoice
};