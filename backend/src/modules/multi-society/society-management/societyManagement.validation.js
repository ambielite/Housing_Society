const { validate: validateUUID } = require("uuid");

const validateSocietyMapping = (req, res, next) => {

    const {
        societyId,
        organizationId,
        clusterId
    } = req.body;

    if (!societyId || !validateUUID(societyId)) {
        return res.status(400).json({
            success: false,
            message: "A valid society must be selected"
        });
    }


    if (
        !organizationId ||
        !validateUUID(organizationId)
    ) {
        return res.status(400).json({
            success: false,
            message: "Organization ID is required"
        });
    }


    if (
        !clusterId ||
        !validateUUID(clusterId)
    ) {
        return res.status(400).json({
            success: false,
            message: "Cluster ID is required"
        });
    }


    next();
};


module.exports = {
    validateSocietyMapping
};
