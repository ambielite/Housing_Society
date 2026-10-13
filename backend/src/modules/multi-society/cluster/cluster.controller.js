const clusterService =
    require("./cluster.service");


const createCluster = async (req, res) => {

    try {

        const cluster =
            await clusterService.createCluster(
                req.body
            );


        return res.status(201).json({
            success: true,
            message:
                "Cluster created successfully",
            data: cluster
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getClusters = async (req, res) => {

    try {

        const clusters =
            await clusterService.getClusters();


        return res.status(200).json({
            success: true,
            data: clusters
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getClustersByOrganization = async (
    req,
    res
) => {

    try {

        const clusters =
            await clusterService
                .getClustersByOrganization(
                    req.params.organizationId
                );


        return res.status(200).json({
            success: true,
            data: clusters
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const getClusterById = async (
    req,
    res
) => {

    try {

        const cluster =
            await clusterService
                .getClusterById(
                    req.params.id
                );


        return res.status(200).json({
            success: true,
            data: cluster
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const updateCluster = async (
    req,
    res
) => {

    try {

        const cluster =
            await clusterService.updateCluster(
                req.params.id,
                req.body
            );


        return res.status(200).json({
            success: true,
            message:
                "Cluster updated successfully",
            data: cluster
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const activateCluster = async (
    req,
    res
) => {

    try {

        const cluster =
            await clusterService.activateCluster(
                req.params.id
            );


        return res.status(200).json({
            success: true,
            message:
                "Cluster activated successfully",
            data: cluster
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deactivateCluster = async (
    req,
    res
) => {

    try {

        const cluster =
            await clusterService.deactivateCluster(
                req.params.id
            );


        return res.status(200).json({
            success: true,
            message:
                "Cluster deactivated successfully",
            data: cluster
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteCluster = async (
    req,
    res
) => {

    try {

        const result =
            await clusterService.deleteCluster(
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
    createCluster,
    getClusters,
    getClustersByOrganization,
    getClusterById,
    updateCluster,
    activateCluster,
    deactivateCluster,
    deleteCluster
};