const express = require("express");

const router =
    express.Router();

const controller =
    require("./account.controller");


/*
 * Create account
 */
router.post(
    "/",
    controller.create
);


/*
 * Get all accounts
 *
 * Optional:
 * ?societyId=UUID
 */
router.get(
    "/",
    controller.getAll
);


/*
 * Get accounts by type
 *
 * Example:
 * /type/SOCIETY_UUID/ASSET
 */
router.get(
    "/type/:societyId/:accountType",
    controller.getByType
);


/*
 * Get child accounts
 */
router.get(
    "/children/:parentAccountId",
    controller.getChildren
);


/*
 * Get account by ID
 */
router.get(
    "/:id",
    controller.getById
);


/*
 * Update account
 */
router.put(
    "/:id",
    controller.update
);


/*
 * Deactivate account
 */
router.post(
    "/:id/deactivate",
    controller.deactivate
);


/*
 * Activate account
 */
router.post(
    "/:id/activate",
    controller.activate
);


/*
 * Delete account
 */
router.delete(
    "/:id",
    controller.remove
);


module.exports = router;