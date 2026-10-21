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

const Resident =
    require("../../residents/resident/resident.model");


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

    return `Rs. ${new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number.isFinite(value) ? value : 0)}`;
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

    const dateOnly = String(value).slice(0, 10);
    const parts = dateOnly.split("-").map(Number);
    const date = parts.length === 3 && parts.every(Number.isFinite)
        ? new Date(parts[0], parts[1] - 1, parts[2])
        : new Date(value);

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

const invoiceDocumentFileName = (invoice) => {
    const safeInvoiceNumber = String(invoice.invoiceNumber || invoice.id).replace(/[^a-zA-Z0-9-_]/g, "_");
    const safeStatus = String(invoice.status || "DRAFT").toLowerCase().replace(/[^a-z0-9-_]/g, "_");
    const safePaid = Number(invoice.paidAmount || 0).toFixed(2).replace(".", "-");
    const safeOutstanding = Number(invoice.outstandingAmount || 0).toFixed(2).replace(".", "-");
    return `${safeInvoiceNumber}-v3-${safeStatus}-${safePaid}-${safeOutstanding}.pdf`;
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

    const resident = invoice.memberId
        ? await Resident.findByPk(invoice.memberId)
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

    invoice.resident =
        resident;


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

const generateLegacyInvoiceDocument = async (
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

const generateInvoiceDocument = async (invoiceId) => {
    ensureDocumentDirectory();
    const invoice = await getInvoiceDetails(invoiceId);
    const fileName = invoiceDocumentFileName(invoice);
    const filePath = path.join(DOCUMENT_ROOT, fileName);
    const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const left = 48;
    const right = pageWidth - 48;
    const contentWidth = right - left;
    const colors = {
        navy: "#16243A",
        indigo: "#4F46E5",
        text: "#263449",
        muted: "#667085",
        line: "#DCE2EB",
        pale: "#F4F6FA",
        white: "#FFFFFF",
        green: "#067647",
        amber: "#B54708",
        red: "#B42318"
    };
    const line = (y, x1 = left, x2 = right, color = colors.line) => {
        doc.save().strokeColor(color).lineWidth(0.8).moveTo(x1, y).lineTo(x2, y).stroke().restore();
    };
    const labelValue = (label, value, x, y, width) => {
        doc.font("Helvetica").fontSize(8).fillColor(colors.muted).text(label.toUpperCase(), x, y, { width });
        doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.text).text(String(value || "-"), x, y + 12, { width });
    };
    const unit = invoice.unit || invoice.Unit;
    const floor = invoice.floor || unit?.floor;
    const tower = invoice.tower || floor?.tower;
    const society = invoice.society || invoice.Society;
    const status = String(invoice.status || "DRAFT").toUpperCase();
    const statusColor = status === "PAID" ? colors.green : status === "OVERDUE" ? colors.red : status === "DRAFT" ? colors.amber : colors.indigo;
    let cursorY = 0;

    const drawFooter = () => {
        const footerY = pageHeight - 48;
        line(footerY, left, right, colors.line);
        doc.font("Helvetica").fontSize(8).fillColor(colors.muted)
            .text("System-generated invoice · Contact society administration for billing queries", left, footerY + 12, { width: contentWidth, align: "center" });
    };
    const drawTableHeader = (y) => {
        doc.save().roundedRect(left, y, contentWidth, 28, 5).fill(colors.navy).restore();
        doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.white);
        doc.text("DESCRIPTION", left + 12, y + 10, { width: 240 });
        doc.text("QTY", left + 260, y + 10, { width: 48, align: "right" });
        doc.text("RATE", left + 322, y + 10, { width: 75, align: "right" });
        doc.text("AMOUNT", left + 410, y + 10, { width: 77, align: "right" });
        return y + 38;
    };
    const drawContinuationHeader = () => {
        doc.save().rect(0, 0, pageWidth, 8).fill(colors.indigo).restore();
        doc.font("Helvetica-Bold").fontSize(13).fillColor(colors.navy)
            .text("INVOICE DETAILS", left, 30, { width: 300 });
        doc.font("Helvetica").fontSize(9).fillColor(colors.muted)
            .text(`${invoice.invoiceNumber || "-"} · ${society?.name || "Housing Society"}`, left, 50, { width: contentWidth });
        cursorY = drawTableHeader(76);
    };

    // Branded document header and society identity.
    doc.save().rect(0, 0, pageWidth, 8).fill(colors.indigo).restore();
    doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.indigo)
        .text("SOCIETY BILLING", left, 34, { characterSpacing: 1.2 });
    doc.font("Helvetica-Bold").fontSize(19).fillColor(colors.navy)
        .text(society?.name || "Housing Society", left, 54, { width: 310 });
    let companyY = doc.y + 4;
    doc.font("Helvetica").fontSize(9).fillColor(colors.muted);
    if (society?.address) {
        doc.text(String(society.address), left, companyY, { width: 300, lineGap: 2 });
        companyY = doc.y + 3;
    }
    const registrations = [
        society?.gstin && `GSTIN: ${society.gstin}`,
        society?.pan && `PAN: ${society.pan}`,
        society?.reraNumber && `RERA: ${society.reraNumber}`
    ].filter(Boolean);
    if (registrations.length) {
        doc.text(registrations.join("   ·   "), left, companyY, { width: 320 });
        companyY = doc.y + 3;
    }

    const statusWidth = Math.max(72, doc.widthOfString(status, { font: "Helvetica-Bold", size: 8 }) + 22);
    doc.save().roundedRect(right - statusWidth, 36, statusWidth, 24, 12).fill(statusColor).restore();
    doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.white)
        .text(status, right - statusWidth + 10, 44, { width: statusWidth - 20, align: "center" });
    doc.font("Helvetica-Bold").fontSize(24).fillColor(colors.navy)
        .text("INVOICE", 350, 72, { width: 197, align: "right" });
    doc.font("Helvetica").fontSize(9).fillColor(colors.muted)
        .text(`No. ${invoice.invoiceNumber || "-"}`, 350, 102, { width: 197, align: "right" });
    line(Math.max(132, companyY + 10), left, right, colors.line);

    // Invoice dates and billing period.
    const metaY = 149;
    const metaHeight = 74;
    doc.save().roundedRect(left, metaY, contentWidth, metaHeight, 8).fill(colors.pale).restore();
    const colWidth = contentWidth / 4;
    labelValue("Invoice number", invoice.invoiceNumber, left + 14, metaY + 15, colWidth - 22);
    labelValue("Invoice date", formatDate(invoice.invoiceDate), left + colWidth, metaY + 15, colWidth - 10);
    labelValue("Billing period", invoice.billingPeriod, left + 2 * colWidth, metaY + 15, colWidth - 10);
    labelValue("Due date", formatDate(invoice.dueDate), left + 3 * colWidth, metaY + 15, colWidth - 14);

    // Resident and unit context; use the loaded floor and tower records.
    const detailY = 241;
    const detailHeight = 91;
    const halfWidth = (contentWidth - 14) / 2;
    doc.save().roundedRect(left, detailY, halfWidth, detailHeight, 8).fill(colors.white).lineWidth(0.8).strokeColor(colors.line).stroke().restore();
    doc.save().roundedRect(left + halfWidth + 14, detailY, halfWidth, detailHeight, 8).fill(colors.white).lineWidth(0.8).strokeColor(colors.line).stroke().restore();
    const resident = invoice.resident;
    const residentName = resident?.displayName || [resident?.firstName, resident?.middleName, resident?.lastName].filter(Boolean).join(" ") || "Resident / unit account";
    doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.navy).text("BILLED TO", left + 14, detailY + 13);
    doc.font("Helvetica").fontSize(9).fillColor(colors.text)
        .text(residentName, left + 14, detailY + 31, { width: halfWidth - 28 });
    doc.font("Helvetica").fontSize(8).fillColor(colors.muted)
        .text(resident?.email || resident?.mobile || "Society resident account", left + 14, detailY + 49, { width: halfWidth - 28 });

    const unitX = left + halfWidth + 28;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.navy).text("UNIT DETAILS", unitX, detailY + 13);
    const unitLabel = unit?.unitNumber || unit?.unitName || unit?.name || "-";
    const location = [tower?.name, floor?.floorNumber || floor?.name].filter(Boolean).join(" · ");
    doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.text).text(`Unit ${unitLabel}`, unitX, detailY + 31, { width: halfWidth - 28 });
    doc.font("Helvetica").fontSize(8).fillColor(colors.muted)
        .text(location || "Building and floor not specified", unitX, detailY + 48, { width: halfWidth - 28 });
    if (unit?.bhk) doc.text(`${unit.bhk} BHK`, unitX, detailY + 64, { width: halfWidth - 28 });

    // Itemized charges.
    doc.font("Helvetica-Bold").fontSize(12).fillColor(colors.navy).text("Charges", left, 354);
    cursorY = drawTableHeader(376);
    const items = invoice.items || [];
    for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const description = String(item.description || "-");
        const descriptionHeight = doc.font("Helvetica").fontSize(9).heightOfString(description, { width: 232, lineGap: 2 });
        const rowHeight = Math.max(32, descriptionHeight + 16);
        if (cursorY + rowHeight > pageHeight - 90) {
            doc.addPage();
            drawContinuationHeader();
        }
        if (index % 2 === 0) doc.save().rect(left, cursorY - 5, contentWidth, rowHeight).fill("#FAFBFD").restore();
        doc.font("Helvetica").fontSize(9).fillColor(colors.text)
            .text(description, left + 12, cursorY + 3, { width: 232, height: rowHeight - 8, lineGap: 2 });
        const quantity = Number(item.quantity || 0);
        doc.text(Number.isFinite(quantity) ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 }).format(quantity) : "0", left + 260, cursorY + 3, { width: 48, align: "right" });
        doc.text(formatCurrency(item.rate), left + 322, cursorY + 3, { width: 75, align: "right" });
        doc.font("Helvetica-Bold").text(formatCurrency(item.totalAmount ?? item.amount), left + 410, cursorY + 3, { width: 77, align: "right" });
        line(cursorY + rowHeight - 3);
        cursorY += rowHeight;
    }

    // Keep the amount summary together as one block.
    if (cursorY + 205 > pageHeight - 68) {
        doc.addPage();
        drawContinuationHeader();
    }
    cursorY += 18;
    const summaryX = left + 270;
    const summaryValueX = left + 384;
    const summaryWidth = right - summaryValueX;
    const summaryLine = (label, value, bold = false, height = 20) => {
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 10 : 9).fillColor(bold ? colors.navy : colors.text)
            .text(label, summaryX, cursorY, { width: 110 });
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 10 : 9).fillColor(bold ? colors.navy : colors.text)
            .text(formatCurrency(value), summaryValueX, cursorY, { width: summaryWidth, align: "right" });
        cursorY += height;
    };
    line(cursorY);
    cursorY += 12;
    summaryLine("Previous balance", invoice.previousBalance);
    summaryLine("Subtotal", invoice.subtotal);
    summaryLine("Tax", invoice.taxAmount);
    summaryLine("Penalty", invoice.penaltyAmount);
    cursorY += 3;
    doc.save().roundedRect(summaryX - 10, cursorY, right - summaryX + 10, 34, 5).fill(colors.pale).restore();
    cursorY += 11;
    summaryLine("TOTAL DUE", invoice.totalAmount, true, 22);
    cursorY += 4;
    summaryLine("Paid amount", invoice.paidAmount, false, 18);
    summaryLine("Outstanding", invoice.outstandingAmount, true, 22);

    if (invoice.description) {
        cursorY += 10;
        doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.navy).text("NOTES", left, cursorY);
        cursorY += 13;
        doc.font("Helvetica").fontSize(8).fillColor(colors.muted)
            .text(String(invoice.description), left, cursorY, { width: contentWidth, lineGap: 2 });
    }

    const pageRange = doc.bufferedPageRange();
    for (let pageIndex = pageRange.start; pageIndex < pageRange.start + pageRange.count; pageIndex += 1) {
        doc.switchToPage(pageIndex);
        drawFooter();
    }

    doc.end();
    await new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
    });

    return {
        success: true,
        fileName,
        filePath,
        relativePath: `/uploads/invoices/${fileName}`,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber
    };
};

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
            fs.existsSync(storedPath) &&
            path.basename(storedPath) === invoiceDocumentFileName(invoice)
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

    if (invoice.documentPath !== generated.relativePath) {
        await invoice.update({
            documentPath: generated.relativePath
        });
    }


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
