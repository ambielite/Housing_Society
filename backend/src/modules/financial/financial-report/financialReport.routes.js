const express = require("express");

const router = express.Router();

const controller =
    require("./financialReport.controller");


router.get(
    "/income-expense/:societyId",
    controller.getIncomeExpense
);


router.get(
    "/balance-sheet/:societyId",
    controller.getBalanceSheet
);


router.get(
    "/trial-balance/:societyId",
    controller.getTrialBalanceSummary
);


router.get(
    "/account/:societyId/:accountId",
    controller.getAccountReport
);


module.exports = router;