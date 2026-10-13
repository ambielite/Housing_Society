const multiSocietyService =
    require("./multiSociety.service");


const createAccess = async (
    req,
    res
) => {

    try {

        const access =
            await multiSocietyService.createAccess(
                req.body,
                req.user?.id
            );


        return res.status(201).json({
            success: true,
            message:
                "Multi-society access created successfully",
            data: access
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getUserAccess = async (
    req,
    res
) => {

    try {

        const accesses =
            await multiSocietyService
                .getUserAccess(
                    req.params.userId
                );


        return res.status(200).json({
            success: true,
            data: accesses
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getActiveUserAccess = async (
    req,
    res
) => {

    try {

        const accesses =
            await multiSocietyService
                .getActiveUserAccess(
                    req.params.userId
                );


        return res.status(200).json({
            success: true,
            data: accesses
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const checkSocietyAccess = async (
    req,
    res
) => {

    try {

        const result =
            await multiSocietyService
                .checkSocietyAccess(
                    req.params.userId,
                    req.params.societyId
                );


        return res.status(
            result.allowed ? 200 : 403
        ).json({
            success: result.allowed,
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const activateAccess = async (
    req,
    res
) => {

    try {

        const access =
            await multiSocietyService
                .activateAccess(
                    req.params.id
                );


        return res.status(200).json({
            success: true,
            message:
                "Access activated successfully",
            data: access
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deactivateAccess = async (
    req,
    res
) => {

    try {

        const access =
            await multiSocietyService
                .deactivateAccess(
                    req.params.id
                );


        return res.status(200).json({
            success: true,
            message:
                "Access deactivated successfully",
            data: access
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteAccess = async (
    req,
    res
) => {

    try {

        const result =
            await multiSocietyService
                .deleteAccess(
                    req.params.id
                );


        return res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createAccess,
    getUserAccess,
    getActiveUserAccess,
    checkSocietyAccess,
    activateAccess,
    deactivateAccess,
    deleteAccess
};