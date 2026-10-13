const societyManagementService =
    require("./societyManagement.service");


const assignSociety = async (req, res) => {

    try {

        const {
            societyId,
            organizationId,
            clusterId
        } = req.body;


        const society =
            await societyManagementService.assignSociety(
                societyId,
                organizationId,
                clusterId
            );


        return res.status(200).json({
            success: true,
            message:
                "Society assigned successfully",
            data: society
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getSocietiesByOrganization = async (
    req,
    res
) => {

    try {

        const societies =
            await societyManagementService
                .getSocietiesByOrganization(
                    req.params.organizationId
                );


        return res.status(200).json({
            success: true,
            data: societies
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const getSocietiesByCluster = async (
    req,
    res
) => {

    try {

        const societies =
            await societyManagementService
                .getSocietiesByCluster(
                    req.params.clusterId
                );


        return res.status(200).json({
            success: true,
            data: societies
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const getSocietyHierarchy = async (
    req,
    res
) => {

    try {

        const result =
            await societyManagementService
                .getSocietyHierarchy(
                    req.params.societyId
                );


        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const getOrganizationHierarchy = async (
    req,
    res
) => {

    try {

        const result =
            await societyManagementService
                .getOrganizationHierarchy(
                    req.params.organizationId
                );


        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const getClusterHierarchy = async (
    req,
    res
) => {

    try {

        const result =
            await societyManagementService
                .getClusterHierarchy(
                    req.params.clusterId
                );


        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const removeSocietyMapping = async (
    req,
    res
) => {

    try {

        const society =
            await societyManagementService
                .removeSocietyMapping(
                    req.params.societyId
                );


        return res.status(200).json({
            success: true,
            message:
                "Society mapping removed successfully",
            data: society
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    assignSociety,
    getSocietiesByOrganization,
    getSocietiesByCluster,
    getSocietyHierarchy,
    getOrganizationHierarchy,
    getClusterHierarchy,
    removeSocietyMapping
};