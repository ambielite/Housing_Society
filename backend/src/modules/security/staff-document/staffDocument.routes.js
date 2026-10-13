const express = require("express");
const multer = require("multer");

const controller =
    require("./staffDocument.controller");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });


router.post(
    "/",
    upload.single("file"),
    controller.createDocument
);


router.get(
    "/",
    controller.getAllDocuments
);


router.get(
    "/staff/:staffId",
    controller.getDocumentsByStaff
);


router.get(
    "/:id",
    controller.getDocumentById
);


router.put(
    "/:id",
    controller.updateDocument
);


router.post(
    "/:id/verify",
    controller.verifyDocument
);


router.post(
    "/:id/reject",
    controller.rejectDocument
);


router.delete(
    "/:id",
    controller.deleteDocument
);


module.exports = router;
