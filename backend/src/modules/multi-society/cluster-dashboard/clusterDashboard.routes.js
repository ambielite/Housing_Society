const express =
    require("express");

const router =
    express.Router();


const {
    getClusterDashboard,
    getClusterSocieties
} = require("./clusterDashboard.controller");


// ============================================================
// CLUSTER DASHBOARD
// ============================================================

router.get(
    "/:clusterId/dashboard",
    getClusterDashboard
);


// ============================================================
// CLUSTER SOCIETIES
// ============================================================

router.get(
    "/:clusterId/societies",
    getClusterSocieties
);


module.exports = router;