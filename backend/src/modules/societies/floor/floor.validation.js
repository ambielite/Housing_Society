const validateCreateFloor = (
    req,
    res,
    next
) => {

    const {
        towerId,
        floorNumber,
        name
    } = req.body;


    if (!towerId) {
        return res.status(400).json({
            success: false,
            message: "Tower ID is required"
        });
    }


    if (
        floorNumber === undefined ||
        floorNumber === null
    ) {
        return res.status(400).json({
            success: false,
            message: "Floor number is required"
        });
    }


    if (
        !Number.isInteger(
            Number(floorNumber)
        ) ||
        Number(floorNumber) < 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Floor number must be a non-negative integer"
        });
    }


    if (
        name !== undefined &&
        name !== null &&
        name.length > 100
    ) {
        return res.status(400).json({
            success: false,
            message: "Floor name cannot exceed 100 characters"
        });
    }


    next();
};


const validateUpdateFloor = (
    req,
    res,
    next
) => {

    const {
        floorNumber,
        name,
        status
    } = req.body;


    if (
        floorNumber !== undefined &&
        (
            !Number.isInteger(
                Number(floorNumber)
            ) ||
            Number(floorNumber) < 0
        )
    ) {
        return res.status(400).json({
            success: false,
            message: "Floor number must be a non-negative integer"
        });
    }


    if (
        name !== undefined &&
        name !== null &&
        name.length > 100
    ) {
        return res.status(400).json({
            success: false,
            message: "Floor name cannot exceed 100 characters"
        });
    }


    if (
        status !== undefined &&
        ![
            "ACTIVE",
            "INACTIVE"
        ].includes(status)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid floor status"
        });
    }


    next();
};


const validateFloorId = (
    req,
    res,
    next
) => {

    if (!req.params.id) {
        return res.status(400).json({
            success: false,
            message: "Floor ID is required"
        });
    }

    next();
};


module.exports = {
    validateCreateFloor,
    validateUpdateFloor,
    validateFloorId
};