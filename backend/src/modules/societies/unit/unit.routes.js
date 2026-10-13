const express = require("express");

const unitController =
    require("./unit.controller");

const {
    validateCreateUnit,
    validateUpdateUnit,
    validateUnitId
} = require("./unit.validation");


const router = express.Router();


// Create Unit
// POST /api/v1/admin/units
router.post(
    "/",
    validateCreateUnit,
    unitController.createUnit
);


// Get all Units
// GET /api/v1/admin/units
router.get(
    "/",
    unitController.getAllUnits
);


// Get Units by Floor
// GET /api/v1/admin/units/floor/:floorId
router.get(
    "/floor/:floorId",
    unitController.getUnitsByFloor
);


// Get Unit by ID
// GET /api/v1/admin/units/:id
router.get(
    "/:id",
    validateUnitId,
    unitController.getUnitById
);


// Update Unit
// PUT /api/v1/admin/units/:id
router.put(
    "/:id",
    validateUnitId,
    validateUpdateUnit,
    unitController.updateUnit
);


// Deactivate Unit
// PATCH /api/v1/admin/units/:id/deactivate
router.patch(
    "/:id/deactivate",
    validateUnitId,
    unitController.deactivateUnit
);


module.exports = router;