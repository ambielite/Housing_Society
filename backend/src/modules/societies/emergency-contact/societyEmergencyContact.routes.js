const express = require("express");
const controller = require("./societyEmergencyContact.controller");
const { validateContact } = require("./societyEmergencyContact.validation");

const router = express.Router();
router.get("/", controller.list);
router.post("/", validateContact, controller.create);
router.put("/:id", validateContact, controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
