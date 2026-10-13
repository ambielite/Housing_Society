const service =
    require("./invoice.service");

const create = async (
    req,
    res
) => {

    try {

        const result =
            await service.createInvoice(
                req.body
            );

        return res.status(
            result.duplicate
                ? 200
                : 201
        ).json({

            success: true,

            message:
                result.duplicate
                    ? "Invoice already exists"
                    : "Invoice created successfully",

            duplicate:
                result.duplicate,

            data:
                result.invoice
        });

    } catch (error) {

        console.error(
            "Create invoice error:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error.message
        });
    }
};

const getAll = async (
    req,
    res
) => {

    try {

        const invoices =
            await service.getAll({
                societyId:
                    req.query.societyId,

                unitId:
                    req.query.unitId,

                status:
                    req.query.status
            });

        return res.json({
            success: true,
            data: invoices
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message:
                error.message
        });
    }
};

const getById = async (
    req,
    res
) => {

    try {

        const invoice =
            await service.getById(
                req.params.id
            );

        return res.json({
            success: true,
            data: invoice
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message:
                error.message
        });
    }
};

const issue = async (
    req,
    res
) => {

    try {

        const invoice =
            await service.issueInvoice(
                req.params.id
            );

        return res.json({

            success: true,

            message:
                "Invoice issued successfully",

            data: invoice
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message:
                error.message
        });
    }
};

const cancel = async (
    req,
    res
) => {

    try {

        const invoice =
            await service.cancelInvoice(
                req.params.id
            );

        return res.json({

            success: true,

            message:
                "Invoice cancelled successfully",

            data: invoice
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message:
                error.message
        });
    }
};

const InvoiceDocumentService =
    require("./invoice.document.service");

const generateDocument = async (
    req,
    res
) => {

    try {

        const result =
            await InvoiceDocumentService
                .generateInvoiceDocument(
                    req.params.id
                );


        /*
         * Save document path
         */

        const invoice =
            await require("./invoice.model")
                .findByPk(
                    req.params.id
                );


        await invoice.update({

            documentPath:
                result.relativePath
        });


        return res.status(200).json({

            success:
                true,

            message:
                "Invoice document generated successfully",

            data:
                result
        });

    } catch (error) {

        console.error(
            "Invoice document error:",
            error
        );

        return res.status(500).json({

            success:
                false,

            message:
                error.message
        });
    }
};

module.exports = {
    create,
    getAll,
    getById,
    issue,
    cancel,
    generateDocument
};