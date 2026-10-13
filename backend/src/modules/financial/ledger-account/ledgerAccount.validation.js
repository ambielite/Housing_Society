const validateCreateLedgerAccount = (req, res, next) => {

    const {
        societyId,
        accountId,
        ledgerCode,
        ledgerName,
        unitId,
        memberId
    } = req.body;


    if (!societyId) {
        return res.status(400).json({
            success: false,
            message: "societyId is required"
        });
    }


    if (!accountId) {
        return res.status(400).json({
            success: false,
            message: "accountId is required"
        });
    }


    if (!ledgerCode) {
        return res.status(400).json({
            success: false,
            message: "ledgerCode is required"
        });
    }


    if (!ledgerName) {
        return res.status(400).json({
            success: false,
            message: "ledgerName is required"
        });
    }


    if (!unitId && !memberId) {
        return res.status(400).json({
            success: false,
            message:
                "Either unitId or memberId is required"
        });
    }


    next();
};


module.exports = {
    validateCreateLedgerAccount
};