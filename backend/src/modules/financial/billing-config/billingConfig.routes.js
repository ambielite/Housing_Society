const express = require("express");

const router = express.Router();

const controller =
    require("./billingConfig.controller");

const {
    validateCreateConfig
} = require("./billingConfig.validation");


router.post(
    "/",
    validateCreateConfig,
    controller.create
);

router.get(
    "/",
    controller.getAll
);

router.get(
    "/:id",
    controller.getById
);

router.put(
    "/:id",
    controller.update
);

router.delete(
    "/:id",
    controller.remove
);


module.exports = router;