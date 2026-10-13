const { validate: isUUID } = require("uuid");


const validateId = (
    req,
    res,
    next
) => {

    if (!isUUID(req.params.id)) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid reminder ID"
        });
    }

    next();
};


const validateSocietyId = (
    req,
    res,
    next
) => {

    if (!isUUID(req.params.societyId)) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid societyId"
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
            message:
                "Invalid agreementId"
        });
    }

    next();
};


const validateCreateConfig = (
    req,
    res,
    next
) => {

    const {
        societyId,
        daysBeforeExpiry,
        reminderType
    } = req.body;


    if (
        !societyId ||
        !isUUID(societyId)
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Valid societyId is required"
        });
    }


    if (
        daysBeforeExpiry === undefined ||
        daysBeforeExpiry === null
    ) {

        return res.status(400).json({
            success: false,
            message:
                "daysBeforeExpiry is required"
        });
    }


    if (
        !Number.isInteger(
            Number(daysBeforeExpiry)
        ) ||
        Number(daysBeforeExpiry) < 0
    ) {

        return res.status(400).json({
            success: false,
            message:
                "daysBeforeExpiry must be a non-negative integer"
        });
    }


    const allowedTypes = [
        "FIRST_REMINDER",
        "SECOND_REMINDER",
        "FINAL_REMINDER",
        "EXPIRY_ALERT"
    ];


    if (
        !allowedTypes.includes(
            reminderType
        )
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid reminderType"
        });
    }


    next();
};


module.exports = {

    validateId,

    validateSocietyId,

    validateAgreementId,

    validateCreateConfig
};