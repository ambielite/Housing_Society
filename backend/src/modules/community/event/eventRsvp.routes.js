const express = require("express");

const router = express.Router();

const controller =
    require("./eventRsvp.controller");


router.post(
    "/events/:eventId/rsvp",
    controller.registerForEvent
);

router.get(
    "/rsvps",
    controller.getRsvps
);

router.get(
    "/rsvps/:id",
    controller.getRsvpById
);

router.post(
    "/rsvps/:id/cancel",
    controller.cancelRsvp
);

router.post(
    "/rsvps/:id/payment-paid",
    controller.markPaymentPaid
);

router.post(
    "/rsvps/:id/payment-failed",
    controller.markPaymentFailed
);

router.post(
    "/rsvps/:id/check-in",
    controller.checkIn
);

router.post(
    "/rsvps/:id/no-show",
    controller.markNoShow
);

router.delete(
    "/rsvps/:id",
    controller.deleteRsvp
);


module.exports = router;