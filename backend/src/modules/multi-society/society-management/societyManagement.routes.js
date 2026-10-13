const express = require("express");

const router = express.Router();

const controller =
    require("./societyManagement.controller");

const {
    validateSocietyMapping
} = require("./societyManagement.validation");


router.post(
    "/assign",
    validateSocietyMapping,
    controller.assignSociety
);


router.get(
    "/organization/:organizationId",
    controller.getSocietiesByOrganization
);


router.get(
    "/cluster/:clusterId",
    controller.getSocietiesByCluster
);


router.get(
    "/society/:societyId",
    controller.getSocietyHierarchy
);


router.get(
    "/organization/:organizationId/hierarchy",
    controller.getOrganizationHierarchy
);


router.get(
    "/cluster/:clusterId/hierarchy",
    controller.getClusterHierarchy
);


router.delete(
    "/society/:societyId/mapping",
    controller.removeSocietyMapping
);


module.exports = router;