const express = require("express");
const controller = require("./societyCommittee.controller");
const { validateMember } = require("./societyCommittee.validation");

const router = express.Router();
router.get("/", controller.list);
router.post("/", validateMember, controller.create);
router.put("/:id", validateMember, controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
