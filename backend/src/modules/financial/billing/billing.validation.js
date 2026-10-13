const validateCreateBilling = (
    req,
    res,
    next
) => {

    const {
        societyId,
        unitId,
        ledgerAccountId,
        billNumber,
        billingPeriod,
        billDate,
        dueDate
    } = req.body;


    if (!societyId) {
        return res.status(400).json({
            success: false,
            message: "societyId is required"
        });
    }


    if (!unitId) {
        return res.status(400).json({
            success: false,
            message: "unitId is required"
        });
    }


    if (!ledgerAccountId) {
        return res.status(400).json({
            success: false,
            message: "ledgerAccountId is required"
        });
    }


    if (!billNumber) {
        return res.status(400).json({
            success: false,
            message: "billNumber is required"
        });
    }


    if (!billingPeriod) {
        return res.status(400).json({
            success: false,
            message: "billingPeriod is required"
        });
    }


    if (!billDate) {
        return res.status(400).json({
            success: false,
            message: "billDate is required"
        });
    }


    if (!dueDate) {
        return res.status(400).json({
            success: false,
            message: "dueDate is required"
        });
    }


    if (
        new Date(billDate) >
        new Date(dueDate)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "billDate cannot be greater than dueDate"
        });
    }


    next();
};


const validateBillingCalculation = (
    req,
    res,
    next
) => {

    const {
        societyId,
        unitId,
        billingRuleCode,
        billDate,
        unitArea
    } = req.body;


    if (!societyId) {
        return res.status(400).json({
            success: false,
            message: "societyId is required"
        });
    }


    if (!unitId) {
        return res.status(400).json({
            success: false,
            message: "unitId is required"
        });
    }


    if (!billingRuleCode) {
        return res.status(400).json({
            success: false,
            message:
                "billingRuleCode is required"
        });
    }


    if (!billDate) {
        return res.status(400).json({
            success: false,
            message: "billDate is required"
        });
    }


    if (
        unitArea !== undefined &&
        Number(unitArea) < 0
    ) {
        return res.status(400).json({
            success: false,
            message:
                "unitArea cannot be negative"
        });
    }


    next();
};


module.exports = {
    validateCreateBilling,
    validateBillingCalculation
};