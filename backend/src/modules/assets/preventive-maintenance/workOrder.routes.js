
const express = require("express");

const router = express.Router();

const controller =
    require("./workOrder.controller");


router.post(
    "/",
    controller.createWorkOrder
);


router.get(
    "/",
    controller.getAllWorkOrders
);


router.get(
    "/asset/:assetId",
    controller.getWorkOrdersByAssetId
);


router.get(
    "/:id",
    controller.getWorkOrderById
);


router.post(
    "/:id/assign",
    controller.assignWorkOrder
);


router.post(
    "/:id/start",
    controller.startWorkOrder
);


router.post(
    "/:id/hold",
    controller.putWorkOrderOnHold
);


router.post(
    "/:id/complete",
    controller.completeWorkOrder
);


router.post(
    "/:id/cancel",
    controller.cancelWorkOrder
);


router.delete(
    "/:id",
    controller.deleteWorkOrder
);


module.exports = router;

