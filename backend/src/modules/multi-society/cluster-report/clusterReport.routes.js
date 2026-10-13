const express = require("express");

const router = express.Router();

const controller =
    require("./clusterReport.controller");


// COMPLETE CLUSTER DASHBOARD
router.get(
    "/cluster/:clusterId/dashboard",
    controller.getClusterDashboard
);


// CLUSTER SUMMARY
router.get(
    "/cluster/:clusterId/summary",
    controller.getClusterSummary
);


// COMPLETE ORGANIZATION DASHBOARD
router.get(
    "/organization/:organizationId/dashboard",
    controller.getOrganizationDashboard
);


module.exports = router;