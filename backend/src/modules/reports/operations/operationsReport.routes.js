const express = require("express");

const router =
    express.Router();

const controller =
    require("./operationsReport.controller");


/*
|--------------------------------------------------------------------------
| Complete Operations Dashboard
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    controller.getOperationsDashboard
);


/*
|--------------------------------------------------------------------------
| Individual Reports
|--------------------------------------------------------------------------
*/

router.get(
    "/occupancy",
    controller.getOccupancyReport
);


router.get(
    "/residents",
    controller.getResidentReport
);


router.get(
    "/vehicles",
    controller.getVehicleReport
);


router.get(
    "/parking",
    controller.getParkingReport
);


module.exports = router;