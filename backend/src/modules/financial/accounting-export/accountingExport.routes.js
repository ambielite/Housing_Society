const express = require("express");

const router =
    express.Router();

const AccountingExportController =
    require("./accountingExport.controller");


/*
|--------------------------------------------------------------------------
| Journal Export
|--------------------------------------------------------------------------
*/

router.get(
    "/journal",
    AccountingExportController
        .exportJournal
);


/*
|--------------------------------------------------------------------------
| Trial Balance Export
|--------------------------------------------------------------------------
*/

router.get(
    "/trial-balance",
    AccountingExportController
        .exportTrialBalance
);


/*
|--------------------------------------------------------------------------
| General Ledger Export
|--------------------------------------------------------------------------
*/

router.get(
    "/general-ledger",
    AccountingExportController
        .exportGeneralLedger
);


module.exports = router;