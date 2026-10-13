const express = require("express");

const router =
    express.Router();

const ReconciliationController =
    require("./reconciliation.controller");


/*
|--------------------------------------------------------------------------
| Import Bank Transaction
|--------------------------------------------------------------------------
*/

router.post(
    "/import",
    ReconciliationController
        .importTransaction
);


/*
|--------------------------------------------------------------------------
| Get All
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    ReconciliationController
        .getAll
);


/*
|--------------------------------------------------------------------------
| Get By ID
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    ReconciliationController
        .getById
);


/*
|--------------------------------------------------------------------------
| Auto Match
|--------------------------------------------------------------------------
*/

router.post(
    "/:id/auto-match",
    ReconciliationController
        .autoMatch
);


/*
|--------------------------------------------------------------------------
| Manual Match
|--------------------------------------------------------------------------
*/

router.post(
    "/:id/manual-match",
    ReconciliationController
        .manualMatch
);


/*
|--------------------------------------------------------------------------
| Reconcile
|--------------------------------------------------------------------------
*/

router.post(
    "/:id/reconcile",
    ReconciliationController
        .reconcile
);


/*
|--------------------------------------------------------------------------
| Ignore
|--------------------------------------------------------------------------
*/

router.post(
    "/:id/ignore",
    ReconciliationController
        .ignoreTransaction
);


module.exports = router;