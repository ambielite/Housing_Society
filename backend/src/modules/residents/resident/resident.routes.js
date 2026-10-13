const express = require("express");

const router = express.Router();

const residentController =
    require("./resident.controller");


// CREATE
router.post(
    "/",
    residentController.createResident
);


// GET ALL
router.get(
    "/",
    residentController.getAllResidents
);


// GET BY ID
router.get(
    "/:id",
    residentController.getResidentById
);


// UPDATE
router.put(
    "/:id",
    residentController.updateResident
);


// CHANGE STATUS
router.patch(
    "/:id/status",
    residentController.changeResidentStatus
);


// DELETE
router.delete(
    "/:id",
    residentController.deleteResident
);


module.exports = router;