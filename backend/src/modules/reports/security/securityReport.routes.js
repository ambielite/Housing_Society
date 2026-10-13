const express = require("express");

const router = express.Router();

const controller =
    require("./securityReport.controller");

const {
    validateDateRange
} = require("./securityReport.validation");


router.get(
    "/visitor-summary",
    validateDateRange,
    controller.getVisitorSummary
);


router.get(
    "/gate-summary",
    validateDateRange,
    controller.getGateSummary
);


router.get(
    "/staff-summary",
    validateDateRange,
    controller.getStaffSummary
);


router.get(
    "/patrol-summary",
    validateDateRange,
    controller.getPatrolSummary
);


module.exports = router;