
const express = require("express");

const router = express.Router();

const memberController = require("./groupMember.controller");


// Add member to group
router.post(
    "/:groupId/members",
    memberController.createMember
);


// Get all members of group
router.get(
    "/:groupId/members",
    memberController.getMembers
);


// Get specific member
router.get(
    "/:groupId/members/:memberId",
    memberController.getMemberById
);


// Update member
router.put(
    "/:groupId/members/:memberId",
    memberController.updateMember
);


// Remove member from group
router.post(
    "/:groupId/members/:memberId/remove",
    memberController.removeMember
);


// Permanently delete member record
router.delete(
    "/:groupId/members/:memberId",
    memberController.deleteMember
);


module.exports = router;

