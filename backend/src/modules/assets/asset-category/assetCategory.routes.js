const express = require("express");

const router = express.Router();

const controller =
    require("./assetCategory.controller");


router.post(
    "/",
    controller.createCategory
);


router.get(
    "/",
    controller.getAllCategories
);


router.get(
    "/:id",
    controller.getCategoryById
);


router.put(
    "/:id",
    controller.updateCategory
);


router.post(
    "/:id/activate",
    controller.activateCategory
);


router.post(
    "/:id/deactivate",
    controller.deactivateCategory
);


router.delete(
    "/:id",
    controller.deleteCategory
);


module.exports = router;