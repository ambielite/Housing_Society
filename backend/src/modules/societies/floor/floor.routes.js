const express = require("express");

const floorController =
    require("./floor.controller");

const {
    validateCreateFloor,
    validateUpdateFloor,
    validateFloorId
} = require("./floor.validation");


const router = express.Router();


// Create Floor
// POST /api/v1/admin/floors
router.post(
    "/",
    validateCreateFloor,
    floorController.createFloor
);


// Get all Floors
// GET /api/v1/admin/floors
router.get(
    "/",
    floorController.getAllFloors
);


// Get Floors by Tower
// GET /api/v1/admin/floors/tower/:towerId
router.get(
    "/tower/:towerId",
    floorController.getFloorsByTower
);


// Get Floor
// GET /api/v1/admin/floors/:id
router.get(
    "/:id",
    validateFloorId,
    floorController.getFloorById
);


// Update Floor
// PUT /api/v1/admin/floors/:id
router.put(
    "/:id",
    validateFloorId,
    validateUpdateFloor,
    floorController.updateFloor
);


// Deactivate Floor
// PATCH /api/v1/admin/floors/:id/deactivate
router.patch(
    "/:id/deactivate",
    validateFloorId,
    floorController.deactivateFloor
);


module.exports = router;