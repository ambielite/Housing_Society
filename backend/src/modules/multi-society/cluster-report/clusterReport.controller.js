const service =
    require("./clusterReport.service");


// CLUSTER DASHBOARD
const getClusterDashboard = async (
    req,
    res
) => {

    try {

        const data =
            await service.getClusterDashboard(
                req.params.clusterId
            );

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Cluster dashboard error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ORGANIZATION DASHBOARD
const getOrganizationDashboard = async (
    req,
    res
) => {

    try {

        const data =
            await service.getOrganizationDashboard(
                req.params.organizationId
            );

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Organization dashboard error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// CLUSTER SUMMARY
const getClusterSummary = async (
    req,
    res
) => {

    try {

        const data =
            await service.getClusterSummary(
                req.params.clusterId
            );

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    getClusterDashboard,
    getOrganizationDashboard,
    getClusterSummary
};