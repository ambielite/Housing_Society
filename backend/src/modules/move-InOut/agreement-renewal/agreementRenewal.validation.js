const { validate: isUUID } = require("uuid");


const validateId = (req, res, next) => {

    if (!isUUID(req.params.id)) {

        return res.status(400).json({
            success: false,
            message: "Invalid renewal ID"
        });

    }

    next();
};


const validateAgreementId = (
    req,
    res,
    next
) => {

    if (!isUUID(req.params.agreementId)) {

        return res.status(400).json({
            success: false,
            message: "Invalid agreement ID"
        });

    }

    next();
};


const validateCreate = (
    req,
    res,
    next
) => {

    const {
        agreementId,
        proposedStartDate,
        proposedExpiryDate
    } = req.body;


    if (
        !agreementId ||
        !isUUID(agreementId)
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Valid agreementId is required"
        });

    }


    if (!proposedStartDate) {

        return res.status(400).json({
            success: false,
            message:
                "proposedStartDate is required"
        });

    }


    if (!proposedExpiryDate) {

        return res.status(400).json({
            success: false,
            message:
                "proposedExpiryDate is required"
        });

    }


    if (
        proposedStartDate >=
        proposedExpiryDate
    ) {

        return res.status(400).json({
            success: false,
            message:
                "proposedExpiryDate must be after proposedStartDate"
        });

    }


    if (
        req.body.requestedBy &&
        !isUUID(req.body.requestedBy)
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid requestedBy UUID"
        });

    }


    next();
};


const validateRemarks = (
    req,
    res,
    next
) => {

    if (!req.body.remarks) {

        return res.status(400).json({
            success: false,
            message:
                "remarks is required"
        });

    }

    next();
};


const validateApproval = (
    req,
    res,
    next
) => {

    if (
        req.body.approvedBy &&
        !isUUID(req.body.approvedBy)
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid approvedBy UUID"
        });

    }

    next();
};


module.exports = {

    validateId,

    validateAgreementId,

    validateCreate,

    validateRemarks,

    validateApproval
};