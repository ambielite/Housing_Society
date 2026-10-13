const express = require("express");

const towerController =
    require("./tower.controller");

const {
    validateCreateTower,
    validateUpdateTower,
    validateTowerId
} = require("./tower.validation");


const router = express.Router();


// POST /api/v1/admin/towers
router.post(
    "/",
    validateCreateTower,
    towerController.createTower
);


// GET /api/v1/admin/towers
router.get(
    "/",
    towerController.getAllTowers
);


// GET /api/v1/admin/towers/society/:societyId
router.get(
    "/society/:societyId",
    towerController.getTowersBySociety
);


// GET /api/v1/admin/towers/:id
router.get(
    "/:id",
    validateTowerId,
    towerController.getTowerById
);


// PUT /api/v1/admin/towers/:id
router.put(
    "/:id",
    validateTowerId,
    validateUpdateTower,
    towerController.updateTower
);


// PATCH /api/v1/admin/towers/:id/deactivate
router.patch(
    "/:id/deactivate",
    validateTowerId,
    towerController.deactivateTower
);


module.exports = router;