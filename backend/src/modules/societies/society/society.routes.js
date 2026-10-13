const express = require("express");


const societyController =
    require("./society.controller");

const {
    validateSocietyCreate,
    validateSocietyUpdate,
    validateSocietyId,
    
} = require("./society.validation");


const router = express.Router();


/*
    CREATE SOCIETY

    POST /api/v1/admin/societies
*/
router.post(
    "/",
    validateSocietyCreate,
    societyController.createSociety
);


/*
    GET ALL SOCIETIES

    GET /api/v1/admin/societies
*/
router.get(
    "/",
    societyController.getAllSocieties
);


/*
    GET SOCIETY BY ID

    GET /api/v1/admin/societies/:id
*/
router.get(
    "/:id",
    validateSocietyId,
    societyController.getSocietyById
);


/*
    UPDATE SOCIETY

    PUT /api/v1/admin/societies/:id
*/
router.put(
    "/:id",
    validateSocietyId,
    validateSocietyUpdate,
    societyController.updateSociety
);

/*
    DELETE SOCIETY

    DELETE /api/v1/admin/societies/:id
*/
router.delete(
    "/:id",
    validateSocietyId,
    
    societyController.deleteSociety
);

module.exports = router;