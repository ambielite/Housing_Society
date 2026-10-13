const express = require("express");

const router = express.Router();

const controller =
    require("./accessAssignment.controller");

const validation =
    require("./accessAssignment.validation");


// Create access assignment
router.post(
    "/",
    validation.validateCreateAccess,
    controller.createAccessAssignment
);


// Get all access assignments
router.get(
    "/",
    controller.getAccessAssignments
);


// Get all active access
// Must come before /:id
router.get(
    "/active",
    controller.getActiveAccess
);


// Get active access by unit
router.get(
    "/unit/:unitId/active",
    validation.validateUnitId,
    controller.getActiveAccessByUnit
);


// Get access history by unit
router.get(
    "/unit/:unitId",
    validation.validateUnitId,
    controller.getAccessHistoryByUnit
);


// Get active access by resident
router.get(
    "/resident/:residentId/active",
    validation.validateResidentId,
    controller.getActiveAccessByResident
);


// Get access history by resident
router.get(
    "/resident/:residentId",
    validation.validateResidentId,
    controller.getAccessHistoryByResident
);


// Get access by lifecycle
router.get(
    "/lifecycle/:lifecycleType/:lifecycleId",
    validation.validateLifecycle,
    controller.getAccessByLifecycle
);


// Get access assignment by ID
router.get(
    "/:id",
    validation.validateAccessId,
    controller.getAccessAssignment
);


// Revoke access
router.post(
    "/:id/revoke",
    validation.validateAccessId,
    validation.validateRevoke,
    controller.revokeAccess
);


// Suspend access
router.post(
    "/:id/suspend",
    validation.validateAccessId,
    controller.suspendAccess
);


// Reactivate access
router.post(
    "/:id/reactivate",
    validation.validateAccessId,
    validation.validateReactivate,
    controller.reactivateAccess
);


// Delete access assignment
router.delete(
    "/:id",
    validation.validateAccessId,
    controller.deleteAccessAssignment
);


module.exports = router;