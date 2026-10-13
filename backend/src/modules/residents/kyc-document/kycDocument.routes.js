const express = require("express");

const router = express.Router();

const controller =
    require("./kycDocument.controller");


// CREATE
router.post(
    "/",
    controller.createDocument
);


// GET ALL
router.get(
    "/",
    controller.getAllDocuments
);


// GET PENDING
router.get(
    "/pending",
    controller.getPendingDocuments
);


// GET BY STAKEHOLDER
router.get(
    "/stakeholder/:stakeholderId",
    controller.getDocumentsByStakeholder
);


// GET BY ID
router.get(
    "/:id",
    controller.getDocumentById
);


// UPDATE
router.put(
    "/:id",
    controller.updateDocument
);


// APPROVE
router.patch(
    "/:id/approve",
    controller.approveDocument
);


// REJECT
router.patch(
    "/:id/reject",
    controller.rejectDocument
);


// REQUEST MORE INFORMATION
router.patch(
    "/:id/request-information",
    controller.requestMoreInformation
);


// ARCHIVE
router.patch(
    "/:id/archive",
    controller.archiveDocument
);


module.exports = router;