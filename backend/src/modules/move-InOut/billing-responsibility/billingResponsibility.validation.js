const { validate: isUUID } = require("uuid");


const validateCreateBillingResponsibility =
    (req, res, next) => {

        const {
            societyId,
            unitId,
            residentId,
            responsibilityType,
            startDate
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
            !unitId ||
            !isUUID(unitId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid unitId is required"
            });
        }


        if (
            !residentId ||
            !isUUID(residentId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid residentId is required"
            });
        }


        if (
            ![
                "OWNER",
                "TENANT"
            ].includes(responsibilityType)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "responsibilityType must be OWNER or TENANT"
            });
        }


        if (!startDate) {
            return res.status(400).json({
                success: false,
                message:
                    "startDate is required"
            });
        }


        next();
    };


const validateId =
    (req, res, next) => {

        if (!isUUID(req.params.id)) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid billing responsibility ID"
            });
        }

        next();
    };


const validateUnitId =
    (req, res, next) => {

        if (!isUUID(req.params.unitId)) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid unit ID"
            });
        }

        next();
    };


const validateResidentId =
    (req, res, next) => {

        if (!isUUID(req.params.residentId)) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid resident ID"
            });
        }

        next();
    };


const validateClose =
    (req, res, next) => {

        if (!req.body.endDate) {

            return res.status(400).json({
                success: false,
                message:
                    "endDate is required"
            });
        }

        next();
    };


const validateTransfer =
    (req, res, next) => {

        const {
            societyId,
            unitId,
            newResidentId,
            newResponsibilityType,
            transferDate
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
            !unitId ||
            !isUUID(unitId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid unitId is required"
            });
        }


        if (
            !newResidentId ||
            !isUUID(newResidentId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid newResidentId is required"
            });
        }


        if (
            ![
                "OWNER",
                "TENANT"
            ].includes(
                newResponsibilityType
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "newResponsibilityType must be OWNER or TENANT"
            });
        }


        if (!transferDate) {
            return res.status(400).json({
                success: false,
                message:
                    "transferDate is required"
            });
        }


        next();
    };


const validateUpdate =
    (req, res, next) => {

        if (
            req.body.billingAccountId &&
            !isUUID(req.body.billingAccountId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid billingAccountId"
            });
        }

        if (
            req.body.residentId &&
            !isUUID(req.body.residentId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid residentId"
            });
        }

        if (
            req.body.responsibilityType &&
            ![
                "OWNER",
                "TENANT"
            ].includes(
                req.body.responsibilityType
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid responsibilityType"
            });
        }

        next();
    };


module.exports = {
    validateCreateBillingResponsibility,
    validateId,
    validateUnitId,
    validateResidentId,
    validateClose,
    validateTransfer,
    validateUpdate
};