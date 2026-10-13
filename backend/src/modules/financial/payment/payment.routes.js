const express = require("express");

const router =
    express.Router();

const PaymentController =
    require("./payment.controller");


/*
|--------------------------------------------------------------------------
| Online Payment
|--------------------------------------------------------------------------
*/

router.post(
    "/initiate",
    PaymentController
        .initiateOnlinePayment
);


/*
|--------------------------------------------------------------------------
| Offline Payment
|--------------------------------------------------------------------------
*/

router.post(
    "/offline",
    PaymentController
        .createOfflinePayment
);


/*
|--------------------------------------------------------------------------
| Payment Webhook
|--------------------------------------------------------------------------
*/

router.post(
    "/webhook",
    PaymentController
        .webhook
);


/*
|--------------------------------------------------------------------------
| Verify Offline Payment
|--------------------------------------------------------------------------
*/

router.post(
    "/:id/verify",
    PaymentController
        .verifyOfflinePayment
);


/*
|--------------------------------------------------------------------------
| Get All Payments
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    PaymentController
        .getAll
);


/*
|--------------------------------------------------------------------------
| Get Payment
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    PaymentController
        .getById
);


/*
|--------------------------------------------------------------------------
| Cancel Payment
|--------------------------------------------------------------------------
*/

router.post(
    "/:id/cancel",
    PaymentController
        .cancelPayment
);


module.exports = router;