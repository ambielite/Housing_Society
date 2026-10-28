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

const SocietyBankAccount =
    require("../society-bank-account/societyBankAccount.model");


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

const societyLogoFilePath = (society) => {
    const logoUrl = society?.logoUrl || society?.logo_url;
    if (typeof logoUrl !== "string" || !logoUrl.startsWith("/uploads/society-logos/")) return null;
    const fileName = path.basename(logoUrl);
    if (!/\.(jpe?g|png)$/i.test(fileName)) return null;
    const filePath = path.join(process.cwd(), "uploads", "society-logos", fileName);
    return fs.existsSync(filePath) ? filePath : null;
};

const invoiceDocumentFileName = (invoice, society = invoice.society || invoice.Society) => {
    const safeInvoiceNumber = String(invoice.invoiceNumber || invoice.id).replace(/[^a-zA-Z0-9-_]/g, "_");
    const safeStatus = String(invoice.status || "DRAFT").toLowerCase().replace(/[^a-z0-9-_]/g, "_");
    const safePaid = Number(invoice.paidAmount || 0).toFixed(2).replace(".", "-");
    const safeOutstanding = Number(invoice.outstandingAmount || 0).toFixed(2).replace(".", "-");
    const logoVersion = society?.logoUrl || society?.logo_url
        ? path.basename(society.logoUrl || society.logo_url).replace(/[^a-zA-Z0-9-_]/g, "_")
        : "none";
    return `${safeInvoiceNumber}-v6-${safeStatus}-${safePaid}-${safeOutstanding}-logo-${logoVersion}.pdf`;
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
    const society = invoice.society || invoice.Society;
    const fileName = invoiceDocumentFileName(invoice, society);
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
        ink: "#1B1B1B",
        text: "#333333",
        muted: "#666666",
        line: "#B9B9B9",
        white: "#FFFFFF",
        green: "#067647",
        amber: "#B54708",
        red: "#B42318"
    };
    const drawRule = (y, width = 0.7) => {
        doc.save().strokeColor(colors.line).lineWidth(width).moveTo(left, y).lineTo(right, y).stroke().restore();
    };
    const unit = invoice.unit || invoice.Unit;
    const floor = invoice.floor || unit?.floor;
    const tower = invoice.tower || floor?.tower;
    const resident = invoice.resident;
    const residentName = resident?.displayName || [resident?.firstName, resident?.middleName, resident?.lastName].filter(Boolean).join(" ") || "Resident / unit account";
    const unitLabel = unit?.unitNumber || unit?.unitName || unit?.name || "-";
    const unitLocation = [tower?.name, floor?.floorNumber || floor?.name].filter(Boolean).join(" · ");
    const status = String(invoice.status || "DRAFT").toUpperCase();
    const statusColor = status === "PAID" ? colors.green : status === "OVERDUE" ? colors.red : status === "DRAFT" ? colors.amber : colors.ink;
    const logoPath = societyLogoFilePath(society);
    const bankAccount = await SocietyBankAccount.findOne({
        where: { societyId: invoice.societyId, isActive: true },
        order: [["isPrimary", "DESC"], ["created_at", "ASC"]]
    }).catch(() => null);
    let cursorY = 0;

    const drawFooter = () => {
        const footerY = pageHeight - 34;
        doc.save().strokeColor("#D2D2D2").lineWidth(0.6).moveTo(left, footerY).lineTo(right, footerY).stroke().restore();
        doc.font("Helvetica").fontSize(7.5).fillColor(colors.muted)
            .text(`${invoice.invoiceNumber || "Invoice"}  ·  ${society?.name || "Housing Society"}`, left, footerY + 10, { width: contentWidth, align: "center" });
    };
    const drawTableHeader = (y) => {
        doc.font("Helvetica-Bold").fontSize(9.5).fillColor(colors.ink);
        doc.text("Item", left, y, { width: 226 });
        doc.text("Quantity", left + 242, y, { width: 62, align: "right" });
        doc.text("Unit Price", left + 320, y, { width: 88, align: "right" });
        doc.text("Total", left + 420, y, { width: 79, align: "right" });
        drawRule(y + 24, 1.2);
        return y + 36;
    };
    const drawContinuationHeader = () => {
        doc.addPage();
        doc.font("Times-Roman").fontSize(25).fillColor(colors.ink).text("Invoice", left, 38);
        doc.font("Helvetica").fontSize(9).fillColor(colors.muted)
            .text(`${invoice.invoiceNumber || "-"}  ·  ${society?.name || "Housing Society"}`, left, 72, { width: contentWidth });
        cursorY = drawTableHeader(104);
    };

    // Reference-style invoice masthead. The logo area is omitted when this
    // society has not uploaded a logo.
    let societyInfoX = left;
    if (logoPath) {
        try {
            doc.image(logoPath, left, 44, { fit: [58, 58], align: "center", valign: "center" });
            societyInfoX = left + 72;
        } catch {
            // Keep invoice generation available if an uploaded logo is unreadable.
        }
    }
    const societyInfoWidth = 286;
    doc.font("Helvetica-Bold").fontSize(15).fillColor(colors.ink)
        .text(society?.name || "Housing Society", societyInfoX, 48, { width: societyInfoWidth });
    let companyY = doc.y + 4;
    doc.font("Helvetica").fontSize(8.5).fillColor(colors.muted);
    if (society?.address) {
        doc.text(String(society.address), societyInfoX, companyY, { width: societyInfoWidth, lineGap: 1 });
        companyY = doc.y + 2;
    }
    const registrations = [
        society?.gstin && `GSTIN: ${society.gstin}`,
        society?.pan && `PAN: ${society.pan}`,
        society?.reraNumber && `RERA: ${society.reraNumber}`
    ].filter(Boolean);
    if (registrations.length) {
        doc.text(registrations.join("   ·   "), societyInfoX, companyY, { width: societyInfoWidth });
    }

    doc.font("Times-Roman").fontSize(34).fillColor(colors.ink)
        .text("Invoice", 340, 43, { width: right - 340, align: "right" });
    doc.font("Helvetica-Bold").fontSize(8).fillColor(statusColor)
        .text(status, 340, 88, { width: right - 340, align: "right", characterSpacing: 0.7 });

    const detailsY = Math.max(145, companyY + 20);
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor(colors.ink).text("Billed to:", left, detailsY);
    doc.font("Helvetica").fontSize(10).fillColor(colors.text).text(residentName, left, detailsY + 22, { width: 255 });
    let recipientY = detailsY + 39;
    if (resident?.mobile) {
        doc.text(String(resident.mobile), left, recipientY, { width: 255 });
        recipientY += 16;
    }
    if (resident?.email) {
        doc.text(String(resident.email), left, recipientY, { width: 255 });
        recipientY += 16;
    }
    doc.text([`Unit ${unitLabel}`, unitLocation].filter(Boolean).join(" · "), left, recipientY, { width: 255 });

    const metaX = 334;
    const metaWidth = right - metaX;
    [
        ["Invoice No.", invoice.invoiceNumber],
        ["Date", formatDate(invoice.invoiceDate)],
        ["Due date", formatDate(invoice.dueDate)],
        ["Billing period", invoice.billingPeriod]
    ].forEach(([label, value], index) => {
        doc.font("Helvetica").fontSize(9.5).fillColor(colors.text)
            .text(`${label}  ${value || "-"}`, metaX, detailsY + index * 20, { width: metaWidth, align: "right" });
    });

    const tableTop = Math.max(detailsY + 107, recipientY + 35);
    drawRule(tableTop - 14, 0.9);
    cursorY = drawTableHeader(tableTop);
    const items = invoice.items || [];
    for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const description = String(item.description || "-");
        const descriptionHeight = doc.font("Helvetica").fontSize(9.5).heightOfString(description, { width: 226, lineGap: 2 });
        const rowHeight = Math.max(38, descriptionHeight + 16);
        if (cursorY + rowHeight > pageHeight - 72) drawContinuationHeader();
        doc.font("Helvetica").fontSize(9.5).fillColor(colors.text)
            .text(description, left, cursorY + 5, { width: 226, height: rowHeight - 8, lineGap: 2 });
        const quantity = Number(item.quantity || 0);
        doc.text(Number.isFinite(quantity) ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 }).format(quantity) : "0", left + 242, cursorY + 5, { width: 62, align: "right" });
        doc.text(formatCurrency(item.rate), left + 320, cursorY + 5, { width: 88, align: "right" });
        doc.text(formatCurrency(item.totalAmount ?? item.amount), left + 420, cursorY + 5, { width: 79, align: "right" });
        drawRule(cursorY + rowHeight - 1);
        cursorY += rowHeight;
    }

    if (cursorY + 195 > pageHeight - 58) drawContinuationHeader();
    cursorY += 16;
    const summaryX = left + 275;
    const summaryWidth = right - summaryX;
    const summaryLine = (label, value, bold = false) => {
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9.5).fillColor(bold ? colors.ink : colors.text)
            .text(label, summaryX, cursorY, { width: summaryWidth - 88 });
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9.5).fillColor(bold ? colors.ink : colors.text)
            .text(formatCurrency(value), summaryX + summaryWidth - 84, cursorY, { width: 84, align: "right" });
        cursorY += 21;
    };
    summaryLine("Previous balance", invoice.previousBalance);
    summaryLine("Subtotal", invoice.subtotal);
    summaryLine("Tax", invoice.taxAmount);
    summaryLine("Penalty", invoice.penaltyAmount);
    const totalBarY = cursorY + 4;
    drawRule(totalBarY, 1.1);
    doc.font("Helvetica-Bold").fontSize(12).fillColor(colors.ink)
        .text("Total", summaryX, totalBarY + 10, { width: summaryWidth - 88 });
    doc.font("Helvetica-Bold").fontSize(12).fillColor(colors.ink)
        .text(formatCurrency(invoice.totalAmount), summaryX + summaryWidth - 98, totalBarY + 10, { width: 98, align: "right" });
    cursorY = totalBarY + 36;
    summaryLine("Paid amount", invoice.paidAmount);
    summaryLine("Outstanding", invoice.outstandingAmount, true);

    if (invoice.description) {
        cursorY += 10;
        doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.ink).text("Notes", left, cursorY);
        cursorY += 13;
        doc.font("Helvetica").fontSize(9).fillColor(colors.text)
            .text(String(invoice.description), left, cursorY, { width: contentWidth, lineGap: 2 });
        cursorY = doc.y + 12;
    }

    if (cursorY + 150 > pageHeight - 48) {
        drawContinuationHeader();
        cursorY += 16;
    }
    doc.font("Times-Italic").fontSize(21).fillColor(colors.ink)
        .text("Thank you!", left, cursorY + 8, { width: 240 });
    cursorY += 54;
    if (bankAccount) {
        doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.ink).text("Payment information", left, cursorY);
        cursorY += 18;
        const bankDetails = [
            bankAccount.bankName,
            `Account name: ${bankAccount.accountHolderName}`,
            `Account no.: ${bankAccount.accountNumber}`,
            `IFSC: ${bankAccount.ifsc}`,
            bankAccount.upiId ? `UPI: ${bankAccount.upiId}` : null
        ].filter(Boolean);
        doc.font("Helvetica").fontSize(8.5).fillColor(colors.text)
            .text(bankDetails.join("\n"), left, cursorY, { width: 260, lineGap: 2 });
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

    const society = await Society.findByPk(invoice.societyId);
    const expectedFileName = invoiceDocumentFileName(invoice, society);


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
            path.basename(storedPath) === expectedFileName
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
