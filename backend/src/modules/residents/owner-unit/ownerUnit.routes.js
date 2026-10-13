const express = require("express");

const router =
    express.Router();

const controller =
    require("./ownerUnit.controller");


// ============================================================
// OWNER ↔ UNIT
// ============================================================

// Create relationship
router.post(
    "/",
    controller.createOwnerUnit
);


// Get all relationships
router.get(
    "/",
    controller.getAllOwnerUnits
);


// Get owners of a unit
router.get(
    "/unit/:unitId/owners",
    controller.getUnitOwners
);


// Get units of an owner
router.get(
    "/owner/:ownerId/units",
    controller.getOwnerUnits
);


// Get relationship by ID
router.get(
    "/:id",
    controller.getOwnerUnitById
);


// Update relationship
router.put(
    "/:id",
    controller.updateOwnerUnit
);


// Deactivate relationship
router.patch(
    "/:id/deactivate",
    controller.deactivateOwnerUnit
);


// Delete inactive relationship
router.delete(
    "/:id",
    controller.deleteOwnerUnit
);


module.exports = router;