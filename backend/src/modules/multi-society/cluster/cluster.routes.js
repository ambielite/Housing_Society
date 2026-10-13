const express = require("express");

const router = express.Router();

const clusterController =
    require("./cluster.controller");

const {
    validateCreateCluster,
    validateUpdateCluster
} = require("./cluster.validation");


router.post(
    "/",
    validateCreateCluster,
    clusterController.createCluster
);


router.get(
    "/",
    clusterController.getClusters
);


router.get(
    "/organization/:organizationId",
    clusterController.getClustersByOrganization
);


router.get(
    "/:id",
    clusterController.getClusterById
);


router.put(
    "/:id",
    validateUpdateCluster,
    clusterController.updateCluster
);


router.post(
    "/:id/activate",
    clusterController.activateCluster
);


router.post(
    "/:id/deactivate",
    clusterController.deactivateCluster
);


router.delete(
    "/:id",
    clusterController.deleteCluster
);


module.exports = router;