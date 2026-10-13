const clusterDashboardService =
    require("./clusterDashboard.service");

const {
    validateClusterId
} = require("./clusterDashboard.validation");


// ============================================================
// GET CLUSTER DASHBOARD
// ============================================================

const getClusterDashboard = async (
    req,
    res
) => {

    try {

        const {
            clusterId
        } = req.params;


        const errors =
            validateClusterId(
                clusterId
            );


        if (errors.length > 0) {

            return res.status(400).json({

                success: false,

                message:
                    errors.join(", "),

                errors
            });
        }


        const dashboard =
            await clusterDashboardService
                .getClusterDashboard(
                    clusterId
                );


        return res.status(200).json({

            success: true,

            message:
                "Cluster dashboard fetched successfully",

            data: dashboard
        });

    }
    catch (error) {

        console.error(
            "Cluster dashboard error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to fetch cluster dashboard"
        });
    }
};


// ============================================================
// GET SOCIETIES UNDER CLUSTER
// ============================================================

const getClusterSocieties = async (
    req,
    res
) => {

    try {

        const {
            clusterId
        } = req.params;


        const errors =
            validateClusterId(
                clusterId
            );


        if (errors.length > 0) {

            return res.status(400).json({

                success: false,

                message:
                    errors.join(", "),

                errors
            });
        }


        const societies =
            await clusterDashboardService
                .getClusterSocieties(
                    clusterId
                );


        return res.status(200).json({

            success: true,

            message:
                "Cluster societies fetched successfully",

            count:
                societies.length,

            data:
                societies
        });

    }
    catch (error) {

        console.error(
            "Cluster societies error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to fetch cluster societies"
        });
    }
};


module.exports = {

    getClusterDashboard,
    getClusterSocieties
};