const express = require("express");

const router = express.Router();

const controller =
    require("./approvalReport.controller");


/*
|--------------------------------------------------------------------------
| Combined 17.5 Dashboard
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    controller.getApprovalsDashboard
);


/*
|--------------------------------------------------------------------------
| Approval Reports
|--------------------------------------------------------------------------
*/

router.get(
    "/approval-status",
    controller.getApprovalStatusReport
);


/*
|--------------------------------------------------------------------------
| SLA Report
|--------------------------------------------------------------------------
*/

router.get(
    "/sla",
    controller.getSlaReport
);


/*
|--------------------------------------------------------------------------
| Payment Report
|--------------------------------------------------------------------------
*/

router.get(
    "/payments",
    controller.getPaymentReport
);


/*
|--------------------------------------------------------------------------
| Detailed Approval Report
|--------------------------------------------------------------------------
*/

router.get(
    "/approvals",
    controller.getApprovalReport
);


module.exports = router;