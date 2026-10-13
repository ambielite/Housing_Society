const validateCreateAccess = (
    req,
    res,
    next
) => {

    const {
        userId,
        accessLevel,
        role
    } = req.body;


    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "User ID is required"
        });
    }


    if (
        ![
            "ORGANIZATION",
            "CLUSTER",
            "SOCIETY"
        ].includes(accessLevel)
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Access level must be ORGANIZATION, CLUSTER or SOCIETY"
        });
    }


    if (!role || role.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Role is required"
        });
    }


    if (
        accessLevel === "ORGANIZATION" &&
        !req.body.organizationId
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Organization ID is required for organization access"
        });
    }


    if (
        accessLevel === "CLUSTER" &&
        (
            !req.body.organizationId ||
            !req.body.clusterId
        )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Organization ID and Cluster ID are required for cluster access"
        });
    }


    if (
        accessLevel === "SOCIETY" &&
        (
            !req.body.organizationId ||
            !req.body.clusterId ||
            !req.body.societyId
        )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Organization ID, Cluster ID and Society ID are required for society access"
        });
    }


    next();
};


module.exports = {
    validateCreateAccess
};