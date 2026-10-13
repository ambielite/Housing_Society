const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const Invoice =
    require("./invoice.model");

const InvoiceItem =
    require("./invoiceItem.model");

const Billing =
    require("../billing/billing.model");

const BillingConfig =
    require("../billing-config/billingConfig.model");

const Unit =
    require("../../societies/unit/unit.model");

const Floor =
    require("../../societies/floor/floor.model");

const Tower =
    require("../../societies/tower/tower.model");

const Society =
    require("../../societies/society/society.model");


/*
|--------------------------------------------------------------------------
| Invoice Document Directory
|--------------------------------------------------------------------------
*/

const DOCUMENT_ROOT =
    path.join(
        process.cwd(),
        "uploads",
        "invoices"
    );


/*
|--------------------------------------------------------------------------
| Ensure Directory Exists
|--------------------------------------------------------------------------
*/

const ensureDocumentDirectory = () => {

    if (!fs.existsSync(DOCUMENT_ROOT)) {

        fs.mkdirSync(
            DOCUMENT_ROOT,
            {
                recursive: true
            }
        );
    }
};


/*
|--------------------------------------------------------------------------
| Format Currency
|--------------------------------------------------------------------------
*/

const formatCurrency = (amount) => {

    const value =
        Number(amount || 0);

    return `Rs. ${value.toFixed(2)}`;
};


/*
|--------------------------------------------------------------------------
| Format Date
|--------------------------------------------------------------------------
*/

const formatDate = (value) => {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
};


/*
|--------------------------------------------------------------------------
| Get Invoice Details
|--------------------------------------------------------------------------
*/

const getInvoiceDetails = async (
    invoiceId
) => {

    const invoice =
        await Invoice.findByPk(
            invoiceId
        );

    if (!invoice) {

        throw new Error(
            "Invoice not found"
        );
    }


    const items =
        await InvoiceItem.findAll({

            where: {
                invoiceId
            }
        });


    const billing =
        invoice.billingId
            ? await Billing.findByPk(
                invoice.billingId
            )
            : null;


    const unit =
        invoice.unitId
            ? await Unit.findByPk(
                invoice.unitId
            )
            : null;


    let floor = null;
    let tower = null;


    if (unit?.floorId) {

        floor =
            await Floor.findByPk(
                unit.floorId
            );
    }


    if (floor?.towerId) {

        tower =
            await Tower.findByPk(
                floor.towerId
            );
    }


    const society =
        invoice.societyId
            ? await Society.findByPk(
                invoice.societyId
            )
            : null;


    invoice.items =
        items;

    invoice.billing =
        billing;

    invoice.unit =
        unit;

    invoice.floor =
        floor;

    invoice.tower =
        tower;

    invoice.society =
        society;


    return invoice;
};


/*
|--------------------------------------------------------------------------
| Draw Horizontal Line
|--------------------------------------------------------------------------
*/

const drawLine = (
    doc,
    y
) => {

    doc
        .moveTo(50, y)
        .lineTo(545, y)
        .stroke();
};


/*
|--------------------------------------------------------------------------
| Generate Invoice PDF
|--------------------------------------------------------------------------
*/

const generateInvoiceDocument = async (
    invoiceId
) => {

    ensureDocumentDirectory();


    /*
     * Load complete invoice
     */

    const invoice =
        await getInvoiceDetails(
            invoiceId
        );


    /*
     * File name
     */

    const safeInvoiceNumber =
        String(
            invoice.invoiceNumber
        )
            .replace(
                /[^a-zA-Z0-9-_]/g,
                "_"
            );

    const fileName =
        `${safeInvoiceNumber}.pdf`;

    const filePath =
        path.join(
            DOCUMENT_ROOT,
            fileName
        );


    /*
     * Create PDF
     */

    const doc =
        new PDFDocument({
            size: "A4",
            margin: 50
        });


    /*
     * Create write stream
     */

    const stream =
        fs.createWriteStream(
            filePath
        );


    /*
     * Connect PDF to file
     */

    doc.pipe(stream);


    /*
     * ------------------------------------------------------
     * HEADER
     * ------------------------------------------------------
     */

    doc
        .fontSize(22)
        .font("Helvetica-Bold")
        .text(
            "TAX INVOICE",
            {
                align: "center"
            }
        );

    doc.moveDown(1);


    /*
     * Society Details
     */

    const society =
        invoice.Society ||
        invoice.society;

    const societyName =
        society?.name ||
        "Housing Society";

    const societyAddress =
        society?.address ||
        "-";

    doc
        .fontSize(15)
        .font("Helvetica-Bold")
        .text(
            societyName
        );

    doc
        .fontSize(10)
        .font("Helvetica")
        .text(
            societyAddress
        );


    if (society?.reraNumber) {

        doc.text(
            `RERA: ${society.reraNumber}`
        );
    }

    if (society?.pan) {

        doc.text(
            `PAN: ${society.pan}`
        );
    }

    if (society?.gstin) {

        doc.text(
            `GSTIN: ${society.gstin}`
        );
    }


    doc.moveDown(1);

    drawLine(
        doc,
        doc.y
    );

    doc.moveDown(1);


    /*
     * Invoice Information
     */

    const invoiceInfoY =
        doc.y;

    doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(
            "Invoice Number:",
            50,
            invoiceInfoY
        );

    doc
        .font("Helvetica")
        .text(
            invoice.invoiceNumber,
            160,
            invoiceInfoY
        );

    doc
        .font("Helvetica-Bold")
        .text(
            "Invoice Date:",
            350,
            invoiceInfoY
        );

    doc
        .font("Helvetica")
        .text(
            formatDate(
                invoice.invoiceDate
            ),
            440,
            invoiceInfoY
        );


    const dueDateY =
        invoiceInfoY + 18;

    doc
        .font("Helvetica-Bold")
        .text(
            "Billing Period:",
            50,
            dueDateY
        );

    doc
        .font("Helvetica")
        .text(
            invoice.billingPeriod,
            160,
            dueDateY
        );

    doc
        .font("Helvetica-Bold")
        .text(
            "Due Date:",
            350,
            dueDateY
        );

    doc
        .font("Helvetica")
        .text(
            formatDate(
                invoice.dueDate
            ),
            440,
            dueDateY
        );


    doc.moveDown(2);


    /*
     * Unit Information
     */

    const unit =
        invoice.Unit ||
        invoice.unit;

    const floor =
        unit?.floor;

    const tower =
        floor?.tower;

    doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .text(
            "Unit Details"
        );

    doc.moveDown(0.5);


    doc
        .fontSize(10)
        .font("Helvetica");

    doc.text(
        `Unit Number: ${unit?.unitNumber || "-"}`
    );

    doc.text(
        `Tower: ${tower?.name || "-"}`
    );

    doc.text(
        `Floor: ${floor?.floorNumber || floor?.name || "-"}`
    );

    if (unit?.bhk) {

        doc.text(
            `BHK: ${unit.bhk}`
        );
    }

    doc.moveDown(1);


    /*
     * Items Heading
     */

    doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .text(
            "Charges"
        );

    doc.moveDown(0.5);


    /*
     * Table Header
     */

    const tableTop =
        doc.y;

    doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(
            "Description",
            50,
            tableTop,
            {
                width: 250
            }
        );

    doc.text(
        "Qty",
        305,
        tableTop,
        {
            width: 50,
            align: "right"
        }
    );

    doc.text(
        "Rate",
        360,
        tableTop,
        {
            width: 80,
            align: "right"
        }
    );

    doc.text(
        "Amount",
        450,
        tableTop,
        {
            width: 95,
            align: "right"
        }
    );


    drawLine(
        doc,
        tableTop + 18
    );


    /*
     * Invoice Items
     */

    let currentY =
        tableTop + 28;

    const items =
        invoice.items || [];


    for (
        const item
        of items
    ) {

        /*
         * Prevent table from
         * overflowing page.
         */

        if (
            currentY > 700
        ) {

            doc.addPage();

            currentY = 60;
        }


        doc
            .fontSize(9)
            .font("Helvetica")
            .text(
                item.description || "-",
                50,
                currentY,
                {
                    width: 250
                }
            );

        doc.text(
            String(
                item.quantity || 0
            ),
            305,
            currentY,
            {
                width: 50,
                align: "right"
            }
        );

        doc.text(
            formatCurrency(
                item.rate
            ),
            360,
            currentY,
            {
                width: 80,
                align: "right"
            }
        );

        doc.text(
            formatCurrency(
                item.totalAmount ||
                item.amount
            ),
            450,
            currentY,
            {
                width: 95,
                align: "right"
            }
        );


        currentY += 22;
    }


    /*
     * Summary
     */

    currentY += 10;

    drawLine(
        doc,
        currentY
    );

    currentY += 15;


    const summaryX =
        350;

    doc
        .fontSize(10)
        .font("Helvetica");

    doc.text(
        "Previous Balance",
        summaryX,
        currentY
    );

    doc.text(
        formatCurrency(
            invoice.previousBalance
        ),
        450,
        currentY,
        {
            width: 95,
            align: "right"
        }
    );


    currentY += 20;

    doc.text(
        "Subtotal",
        summaryX,
        currentY
    );

    doc.text(
        formatCurrency(
            invoice.subtotal
        ),
        450,
        currentY,
        {
            width: 95,
            align: "right"
        }
    );


    currentY += 20;

    doc.text(
        "Tax",
        summaryX,
        currentY
    );

    doc.text(
        formatCurrency(
            invoice.taxAmount
        ),
        450,
        currentY,
        {
            width: 95,
            align: "right"
        }
    );


    currentY += 20;

    doc.text(
        "Penalty",
        summaryX,
        currentY
    );

    doc.text(
        formatCurrency(
            invoice.penaltyAmount
        ),
        450,
        currentY,
        {
            width: 95,
            align: "right"
        }
    );


    currentY += 25;

    drawLine(
        doc,
        currentY
    );

    currentY += 15;


    /*
     * Total
     */

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(
            "TOTAL",
            summaryX,
            currentY
        );

    doc.text(
        formatCurrency(
            invoice.totalAmount
        ),
        450,
        currentY,
        {
            width: 95,
            align: "right"
        }
    );


    /*
     * Paid amount
     */

    currentY += 25;

    doc
        .fontSize(10)
        .font("Helvetica")
        .text(
            "Paid Amount",
            summaryX,
            currentY
        );

    doc.text(
        formatCurrency(
            invoice.paidAmount
        ),
        450,
        currentY,
        {
            width: 95,
            align: "right"
        }
    );


    /*
     * Outstanding
     */

    currentY += 20;

    doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(
            "Outstanding",
            summaryX,
            currentY
        );

    doc.text(
        formatCurrency(
            invoice.outstandingAmount
        ),
        450,
        currentY,
        {
            width: 95,
            align: "right"
        }
    );


    /*
     * Status
     */

    currentY += 35;

    doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(
            `Status: ${invoice.status}`
        );


    /*
     * Description
     */

    if (
        invoice.description
    ) {

        currentY += 25;

        doc
            .fontSize(9)
            .font("Helvetica")
            .text(
                invoice.description
            );
    }


    /*
     * Footer
     */

    doc
        .fontSize(8)
        .font("Helvetica")
        .text(
            "This is a system-generated invoice.",
            50,
            760,
            {
                align: "center",
                width: 495
            }
        );

    doc.text(
        "Please contact the society administration for any billing clarification.",
        50,
        775,
        {
            align: "center",
            width: 495
        }
    );


    /*
     * Finalize PDF
     */

    doc.end();


    /*
     * Wait until file is completely written.
     */

    await new Promise(
        (
            resolve,
            reject
        ) => {

            stream.on(
                "finish",
                resolve
            );

            stream.on(
                "error",
                reject
            );
        }
    );


    /*
     * Return document information
     */

    return {

        success:
            true,

        fileName,

        filePath,

        relativePath:
            `/uploads/invoices/${fileName}`,

        invoiceId:
            invoice.id,

        invoiceNumber:
            invoice.invoiceNumber
    };
};


/*
|--------------------------------------------------------------------------
| Check Document Exists
|--------------------------------------------------------------------------
*/

const getInvoiceDocumentPath = async (
    invoiceId
) => {

    const invoice =
        await Invoice.findByPk(
            invoiceId
        );

    if (!invoice) {

        throw new Error(
            "Invoice not found"
        );
    }


    if (
        invoice.documentPath
    ) {

        const storedPath =
            path.join(
                process.cwd(),
                invoice.documentPath
                    .replace(
                        /^\//,
                        ""
                    )
            );

        if (
            fs.existsSync(
                storedPath
            )
        ) {

            return {

                invoice,

                filePath:
                    storedPath
            };
        }
    }


    /*
     * Generate if it does not exist.
     */

    const generated =
        await generateInvoiceDocument(
            invoiceId
        );


    /*
     * Save document path
     * in invoice.
     */

    await invoice.update({

        documentPath:
            generated.relativePath
    });


    return {

        invoice,

        filePath:
            generated.filePath
    };
};


/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {

    generateInvoiceDocument,

    getInvoiceDocumentPath
};