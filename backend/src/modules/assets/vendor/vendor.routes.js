const express = require("express");

const router = express.Router();

const vendorController =
    require("./vendor.controller");


router.post(
    "/",
    vendorController.createVendor
);


router.get(
    "/",
    vendorController.getAllVendors
);


router.get(
    "/:id",
    vendorController.getVendorById
);


router.put(
    "/:id",
    vendorController.updateVendor
);


router.post(
    "/:id/activate",
    vendorController.activateVendor
);


router.post(
    "/:id/deactivate",
    vendorController.deactivateVendor
);


router.post(
    "/:id/blacklist",
    vendorController.blacklistVendor
);


router.delete(
    "/:id",
    vendorController.deleteVendor
);


module.exports = router;