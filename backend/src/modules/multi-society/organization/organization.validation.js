const validateCreateOrganization = (req, res, next) => {

    const {
        name,
        code
    } = req.body;

    if (!name || name.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Organization name is required"
        });
    }

    if (!code || code.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Organization code is required"
        });
    }

    next();
};


const validateUpdateOrganization = (req, res, next) => {

    const {
        name,
        code,
        status
    } = req.body;

    if (
        name !== undefined &&
        name.trim() === ""
    ) {
        return res.status(400).json({
            success: false,
            message: "Organization name cannot be empty"
        });
    }

    if (
        code !== undefined &&
        code.trim() === ""
    ) {
        return res.status(400).json({
            success: false,
            message: "Organization code cannot be empty"
        });
    }

    if (
        status !== undefined &&
        !["ACTIVE", "INACTIVE"].includes(status)
    ) {
        return res.status(400).json({
            success: false,
            message: "Status must be ACTIVE or INACTIVE"
        });
    }

    next();
};


module.exports = {
    validateCreateOrganization,
    validateUpdateOrganization
};