const { Op } = require("sequelize");

const Society = require("../../../modules/societies/society/society.model");
const Cluster = require("../cluster/cluster.model");
const Organization = require("../organization/organization.model");
const SocietyAccess = require("../society-access/societyAccess.model");


/*
|--------------------------------------------------------------------------
| Get Cluster Summary
|--------------------------------------------------------------------------
*/
const getClusterSummary = async (clusterId) => {
    try {
        /*
         * Get cluster information
         */
        const cluster = await Cluster.findByPk(clusterId, {
            attributes: ["id", "name"]
        });

        if (!cluster) {
            throw new Error("Cluster not found");
        }

        /*
         * Get societies belonging to this cluster
         *
         * IMPORTANT:
         * Society model does NOT contain isActive.
         * Therefore we only select existing columns.
         */
        const societies = await Society.findAll({
            where: {
                clusterId: clusterId
            },
            attributes: ["id", "name"],
            order: [["name", "ASC"]]
        });

        /*
         * Since Society does not currently have an active/inactive
         * field, every society returned from the cluster is treated
         * as an available/active society for reporting purposes.
         */
        const totalSocieties = societies.length;

        /*
         * Get society IDs for access calculation
         */
        const societyIds = societies.map((society) => society.id);

        /*
         * Get access information for societies in this cluster
         */
        let accessRecords = [];

        if (societyIds.length > 0) {
            accessRecords = await SocietyAccess.findAll({
                where: {
                    societyId: {
                        [Op.in]: societyIds
                    }
                },
                attributes: [
                    "id",
                    "userId",
                    "societyId",
                    "accessType",
                    "isActive",
                    "isDefault",
                    "validFrom",
                    "validUntil"
                ]
            });
        }

        /*
         * Active access
         */
        const activeAccess = accessRecords.filter((access) => {
            if (!access.isActive) {
                return false;
            }

            const now = new Date();

            if (access.validFrom && new Date(access.validFrom) > now) {
                return false;
            }

            if (access.validUntil && new Date(access.validUntil) < now) {
                return false;
            }

            return true;
        });

        /*
         * Delegated administrators
         */
        const delegatedAdmins = activeAccess.filter(
            (access) => access.accessType === "DELEGATED_ADMIN"
        );

        /*
         * Return cluster summary
         */
        return {
            cluster: {
                id: cluster.id,
                name: cluster.name
            },

            summary: {
                totalSocieties,
                activeSocieties: totalSocieties,
                inactiveSocieties: 0,

                societies: societies.map((society) => ({
                    id: society.id,
                    name: society.name
                }))
            },

            access: {
                totalUsers: new Set(
                    accessRecords.map((access) => access.userId)
                ).size,

                activeAccess: activeAccess.length,

                delegatedAdmins: delegatedAdmins.length
            }
        };
    } catch (error) {
        console.error("Cluster summary error:", error);
        throw error;
    }
};


/*
|--------------------------------------------------------------------------
| Get Cluster Dashboard
|--------------------------------------------------------------------------
*/
const getClusterDashboard = async (clusterId) => {
    try {
        /*
         * Run cluster summary and other dashboard information
         * together.
         */
        const [summary] = await Promise.all([
            getClusterSummary(clusterId)
        ]);

        return {
            cluster: summary.cluster,

            summary: summary.summary,

            access: summary.access,

            generatedAt: new Date()
        };
    } catch (error) {
        console.error("Cluster dashboard error:", error);
        throw error;
    }
};


/*
|--------------------------------------------------------------------------
| Get Organization Dashboard
|--------------------------------------------------------------------------
*/
const getOrganizationDashboard = async (organizationId) => {
    try {
        /*
         * Find organization
         */
        const organization = await Organization.findByPk(organizationId, {
            attributes: ["id", "name"]
        });

        if (!organization) {
            throw new Error("Organization not found");
        }

        /*
         * Get all clusters belonging to organization
         */
        const clusters = await Cluster.findAll({
            where: {
                organizationId: organizationId
            },
            attributes: ["id", "name"],
            order: [["name", "ASC"]]
        });

        /*
         * Generate dashboard information for every cluster
         */
        const clusterReports = await Promise.all(
            clusters.map(async (cluster) => {
                return await getClusterSummary(cluster.id);
            })
        );

        /*
         * Calculate organization-level society count
         */
        let totalSocieties = 0;
        let activeSocieties = 0;
        let inactiveSocieties = 0;

        clusterReports.forEach((report) => {
            totalSocieties += report.summary.totalSocieties;
            activeSocieties += report.summary.activeSocieties;
            inactiveSocieties += report.summary.inactiveSocieties;
        });

        return {
            organization: {
                id: organization.id,
                name: organization.name
            },

            summary: {
                totalClusters: clusters.length,

                totalSocieties,

                activeSocieties,

                inactiveSocieties
            },

            clusters: clusterReports,

            generatedAt: new Date()
        };
    } catch (error) {
        console.error("Organization dashboard error:", error);
        throw error;
    }
};


/*
|--------------------------------------------------------------------------
| Export Services
|--------------------------------------------------------------------------
*/
module.exports = {
    getClusterSummary,
    getClusterDashboard,
    getOrganizationDashboard
};