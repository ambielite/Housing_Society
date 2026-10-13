const clusterDashboardRepository =
    require("./clusterDashboard.repository");

const Cluster =
    require("../cluster/cluster.model");

const Organization =
    require("../organization/organization.model");


// ============================================================
// GET CLUSTER DASHBOARD
// ============================================================

const getClusterDashboard = async (clusterId) => {

    // --------------------------------------------------------
    // Check cluster
    // --------------------------------------------------------

    const cluster =
        await Cluster.findByPk(clusterId);

    if (!cluster) {
        throw new Error("Cluster not found");
    }


    // --------------------------------------------------------
    // Get organization
    // --------------------------------------------------------

    const organization =
        await Organization.findByPk(
            cluster.organizationId
        );


    // --------------------------------------------------------
    // Get societies
    // --------------------------------------------------------

    const societies =
        await clusterDashboardRepository
            .getClusterSocieties(clusterId);


    const societyIds =
        societies.map(
            society => society.id
        );


    // --------------------------------------------------------
    // Financial summary
    // --------------------------------------------------------

    const invoiceSummary =
        await clusterDashboardRepository
            .getInvoiceSummary(
                societyIds
            );


    const paymentSummary =
        await clusterDashboardRepository
            .getPaymentSummary(
                societyIds
            );


    // --------------------------------------------------------
    // Society-wise summary
    // --------------------------------------------------------

    const societySummary =
        await clusterDashboardRepository
            .getSocietySummary(
                societyIds
            );


    // --------------------------------------------------------
    // Final dashboard
    // --------------------------------------------------------

    return {

        organization: organization
            ? {
                id: organization.id,
                name: organization.name,
                code: organization.code
            }
            : null,

        cluster: {

            id: cluster.id,

            name: cluster.name,

            code: cluster.code,

            status: cluster.status,

            totalSocieties:
                societies.length
        },


        financial: {

            totalInvoices:
                invoiceSummary.totalInvoices,

            totalBilled:
                invoiceSummary.totalBilled,

            totalOutstanding:
                invoiceSummary.totalOutstanding,

            totalCollected:
                paymentSummary.totalCollected,

            totalPayments:
                paymentSummary.totalPayments,

            successfulPayments:
                paymentSummary.successfulPayments,

            failedPayments:
                paymentSummary.failedPayments
        },


        societies:
            societySummary
    };
};


// ============================================================
// GET CLUSTER SOCIETY LIST
// ============================================================

const getClusterSocieties = async (clusterId) => {

    const cluster =
        await Cluster.findByPk(clusterId);

    if (!cluster) {
        throw new Error("Cluster not found");
    }

    return await clusterDashboardRepository
        .getClusterSocieties(clusterId);
};


module.exports = {

    getClusterDashboard,
    getClusterSocieties
};