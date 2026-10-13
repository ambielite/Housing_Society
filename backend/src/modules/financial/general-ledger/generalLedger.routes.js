const express = require("express");

const router = express.Router();

const controller =
    require("./generalLedger.controller");


// General Ledger for society
router.get(
    "/society/:societyId",
    controller.getGeneralLedger
);


// General Ledger for specific accounting period
router.get(
    "/period/:societyId/:accountingPeriodId",
    controller.getPeriodLedger
);


// Specific account ledger
router.get(
    "/account/:societyId/:accountId",
    controller.getAccountLedger
);


// Specific account summary
router.get(
    "/account/:societyId/:accountId/summary",
    controller.getAccountSummary
);


module.exports = router;