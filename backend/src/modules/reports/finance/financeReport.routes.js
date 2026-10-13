const express = require("express");

const router = express.Router();

const controller =
    require("./financeReport.controller");


/*
|--------------------------------------------------------------------------
| Complete Finance Dashboard
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    controller.getFinanceDashboard
);


/*
|--------------------------------------------------------------------------
| Individual Finance Reports
|--------------------------------------------------------------------------
*/

router.get(
    "/bank-balance",
    controller.getBankBalance
);


router.get(
    "/collection",
    controller.getCollection
);


router.get(
    "/arrears",
    controller.getArrears
);


router.get(
    "/income-expense",
    controller.getIncomeExpense
);


module.exports = router;