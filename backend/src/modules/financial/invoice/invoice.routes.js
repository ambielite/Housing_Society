const express =
    require("express");

const router =
    express.Router();

const controller =
    require("./invoice.controller");

const {
    validateCreateInvoice
} =
    require("./invoice.validation");

router.post(
    "/",
    validateCreateInvoice,
    controller.create
);

router.get(
    "/",
    controller.getAll
);

router.get(
    "/:id",
    controller.getById
);

router.post(
    "/:id/issue",
    controller.issue
);

router.post(
    "/:id/cancel",
    controller.cancel
);
router.post(
    "/:id/document",
    controller.generateDocument
);
const fs =
    require("fs");

const InvoiceDocumentService =
    require("./invoice.document.service");


router.get(
    "/:id/document",
    async (
        req,
        res
    ) => {

        try {

            const result =
                await InvoiceDocumentService
                    .getInvoiceDocumentPath(
                        req.params.id
                    );


            return res.download(
                result.filePath
            );

        } catch (error) {

            return res.status(404).json({

                success:
                    false,

                message:
                    error.message
            });
        }
    }
);

module.exports = router;