const validateCreateConfig = (req, res, next) => {

    const {
        societyId,
        configType,
        code,
        name,
        effectiveFrom
    } = req.body;

    if (!societyId) {
        return res.status(400).json({
            success: false,
            message: "societyId is required"
        });
    }

    if (!configType) {
        return res.status(400).json({
            success: false,
            message: "configType is required"
        });
    }

    if (![
        "CHARGE_HEAD",
        "BILLING_RULE",
        "BILLING_CYCLE",
        "PENALTY_RULE"
    ].includes(configType)) {
        return res.status(400).json({
            success: false,
            message: "Invalid configType"
        });
    }

    if (!code) {
        return res.status(400).json({
            success: false,
            message: "code is required"
        });
    }

    if (!name) {
        return res.status(400).json({
            success: false,
            message: "name is required"
        });
    }

    if (!effectiveFrom) {
        return res.status(400).json({
            success: false,
            message: "effectiveFrom is required"
        });
    }

    next();
};

module.exports = {
    validateCreateConfig
};