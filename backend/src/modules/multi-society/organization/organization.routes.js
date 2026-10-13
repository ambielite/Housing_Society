const express = require("express");

const router = express.Router();

const organizationController =
    require("./organization.controller");

const {
    validateCreateOrganization,
    validateUpdateOrganization
} = require("./organization.validation");


router.post(
    "/",
    validateCreateOrganization,
    organizationController.createOrganization
);


router.get(
    "/",
    organizationController.getOrganizations
);


router.get(
    "/:id",
    organizationController.getOrganizationById
);


router.put(
    "/:id",
    validateUpdateOrganization,
    organizationController.updateOrganization
);


router.post(
    "/:id/activate",
    organizationController.activateOrganization
);


router.post(
    "/:id/deactivate",
    organizationController.deactivateOrganization
);


router.delete(
    "/:id",
    organizationController.deleteOrganization
);


module.exports = router;