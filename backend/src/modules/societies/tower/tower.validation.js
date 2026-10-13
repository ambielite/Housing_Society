const validateCreateTower = (
    req,
    res,
    next
) => {

    const {
        societyId,
        name,
        floorCount
    } = req.body;


    if (!societyId) {

        return res.status(400).json({
            success: false,
            message: "Society ID is required"
        });

    }


    if (
        !name ||
        name.trim() === ""
    ) {

        return res.status(400).json({
            success: false,
            message: "Tower name is required"
        });

    }


    if (name.length > 255) {

        return res.status(400).json({
            success: false,
            message: "Tower name cannot exceed 255 characters"
        });

    }


    if (
        floorCount === undefined ||
        floorCount === null
    ) {

        return res.status(400).json({
            success: false,
            message: "Floor count is required"
        });

    }


    if (
        !Number.isInteger(
            Number(floorCount)
        ) ||
        Number(floorCount) < 1
    ) {

        return res.status(400).json({
            success: false,
            message: "Floor count must be a positive integer"
        });

    }


    next();
};


const validateUpdateTower = (
    req,
    res,
    next
) => {

    const {
        name,
        floorCount,
        status
    } = req.body;


    if (
        name !== undefined &&
        (
            !name ||
            name.trim() === ""
        )
    ) {

        return res.status(400).json({
            success: false,
            message: "Tower name cannot be empty"
        });

    }


    if (
        floorCount !== undefined &&
        (
            !Number.isInteger(
                Number(floorCount)
            ) ||
            Number(floorCount) < 1
        )
    ) {

        return res.status(400).json({
            success: false,
            message: "Floor count must be a positive integer"
        });

    }


    if (
        status !== undefined &&
        !["ACTIVE", "INACTIVE"].includes(status)
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid tower status"
        });

    }


    next();
};


const validateTowerId = (
    req,
    res,
    next
) => {

    if (!req.params.id) {

        return res.status(400).json({
            success: false,
            message: "Tower ID is required"
        });

    }

    next();
};


module.exports = {
    validateCreateTower,
    validateUpdateTower,
    validateTowerId
};