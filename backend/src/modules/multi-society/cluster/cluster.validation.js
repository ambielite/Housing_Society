const validateCreateCluster = (req, res, next) => {

    const {
        organizationId,
        name,
        code
    } = req.body;


    if (
        !organizationId ||
        organizationId.trim() === ""
    ) {
        return res.status(400).json({
            success: false,
            message: "Organization ID is required"
        });
    }


    if (
        !name ||
        name.trim() === ""
    ) {
        return res.status(400).json({
            success: false,
            message: "Cluster name is required"
        });
    }


    if (
        !code ||
        code.trim() === ""
    ) {
        return res.status(400).json({
            success: false,
            message: "Cluster code is required"
        });
    }


    next();
};


const validateUpdateCluster = (req, res, next) => {

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
            message: "Cluster name cannot be empty"
        });
    }


    if (
        code !== undefined &&
        code.trim() === ""
    ) {
        return res.status(400).json({
            success: false,
            message: "Cluster code cannot be empty"
        });
    }


    if (
        status !== undefined &&
        !["ACTIVE", "INACTIVE"].includes(status)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Status must be ACTIVE or INACTIVE"
        });
    }


    next();
};


module.exports = {
    validateCreateCluster,
    validateUpdateCluster
};