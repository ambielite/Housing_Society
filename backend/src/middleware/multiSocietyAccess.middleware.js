const multiSocietyService =
    require("../../../modules/multi-society/multi-society/multiSociety.service");


const requireSocietyAccess = async (
    req,
    res,
    next
) => {

    try {

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }


        const societyId =
            req.params.societyId ||
            req.body.societyId ||
            req.query.societyId;


        if (!societyId) {
            return res.status(400).json({
                success: false,
                message:
                    "Society ID is required"
            });
        }


        const access =
            await multiSocietyService
                .checkSocietyAccess(
                    req.user.id,
                    societyId
                );


        if (!access.allowed) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this society"
            });
        }


        req.societyContext = {
            societyId,
            accessLevel:
                access.accessLevel,
            role:
                access.role
        };


        next();

    } catch (error) {

        return res.status(500).json({
            success: false,
            message:
                "Society access validation failed"
        });
    }
};


module.exports = {
    requireSocietyAccess
};