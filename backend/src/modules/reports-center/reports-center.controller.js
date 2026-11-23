const fs = require('node:fs');
const path = require('node:path');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const service = require('./reports-center.service');
const financeReports = require('../reports/finance/financeReport.service');
const operationsReports = require('../reports/operations/operationsReport.service');
const securityReports = require('../reports/security/securityReport.service');
const approvalReports = require('../reports/approvals/approvalReport.service');
const dashboardReports = require('../reports/dashboard/dashboard.service');
const ApiError = require('../../common/ApiError');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');
const Society = require('../societies/society/society.model');

/** Non-SUPER_ADMIN users can only report on their own society. */
const resolveSocietyId = (req) => {
  const requested = req.query.societyId;
  const own = req.user.societyId;
  if (req.user.roles.includes('SUPER_ADMIN')) {
    const id = requested || own;
    if (!id) throw new ApiError(400, 'societyId is required');
    return id;
  }
  if (!own) throw new ApiError(403, 'No society context for this user');
  if (requested && requested !== own) throw new ApiError(403, 'You can only view reports for your own society');
  return own;
};

const assertExportAllowed = (req) => {
  if (req.user.roles.includes('SUPER_ADMIN')) return;
  if (!req.user.permissions.includes('REPORT_EXPORT')) {
    throw new ApiError(403, 'You do not have permission to export reports');
  }
};

const exportTasks = {
  dashboard: { permission: 'REPORT_DASHBOARD_READ', run: service.getDashboard },
  parking: { permission: 'REPORT_OPERATIONS_READ', run: service.getParkingReport },
  'procurement-summary': { permission: 'REPORT_PROCUREMENT_READ', run: service.getProcurementSummary },
  'legacy-executive': { permission: 'REPORT_DASHBOARD_READ', run: dashboardReports.getExecutiveDashboard },
  'finance-dashboard': { permission: 'REPORT_FINANCE_READ', run: financeReports.getFinanceDashboard },
  'bank-balance': { permission: 'REPORT_FINANCE_READ', run: financeReports.getBankBalance },
  collection: { permission: 'REPORT_FINANCE_READ', run: financeReports.getCollection },
  arrears: { permission: 'REPORT_FINANCE_READ', run: financeReports.getArrears },
  'income-expense': { permission: 'REPORT_FINANCE_READ', run: financeReports.getIncomeExpense },
  'society-operations': { permission: 'REPORT_OPERATIONS_READ', run: operationsReports.getOperationsDashboard },
  occupancy: { permission: 'REPORT_OPERATIONS_READ', run: operationsReports.getOccupancyReport },
  residents: { permission: 'REPORT_OPERATIONS_READ', run: operationsReports.getResidentReport },
  'society-vehicles': { permission: 'REPORT_OPERATIONS_READ', run: operationsReports.getVehicleReport },
  'legacy-visitors': { permission: 'REPORT_SECURITY_READ', run: securityReports.getVisitorSummary },
  'gate-summary': { permission: 'REPORT_SECURITY_READ', run: securityReports.getGateSummary },
  'staff-summary': { permission: 'REPORT_SECURITY_READ', run: securityReports.getStaffSummary },
  'patrol-summary': { permission: 'REPORT_SECURITY_READ', run: securityReports.getPatrolSummary },
  'approvals-dashboard': { permission: 'REPORT_APPROVAL_READ', run: approvalReports.getApprovalsDashboard },
  'approval-details': { permission: 'REPORT_APPROVAL_READ', run: approvalReports.getApprovalReport },
  'approval-status': { permission: 'REPORT_APPROVAL_READ', run: approvalReports.getApprovalStatusReport },
  'approval-sla': { permission: 'REPORT_APPROVAL_READ', run: approvalReports.getSlaReport },
  'approval-payments': { permission: 'REPORT_APPROVAL_READ', run: approvalReports.getPaymentReport },
};

// --- CSV (guards against spreadsheet formula injection) ---------------------
const csvCell = (value) => {
  if (value === null || value === undefined) return '';
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const sendCsv = (res, name, rows) => {
  const list = rows || [];
  const headers = list.length ? Object.keys(list[0]) : [];
  const lines = [headers.join(',')].concat(list.map((row) => headers.map((h) => csvCell(row[h])).join(',')));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.csv"`);
  return res.status(200).send(lines.join('\n'));
};

const exportRowsFromData = (data) => {
  const rows = [];
  const walk = (value, section = 'Summary') => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          rows.push({ section, ...Object.fromEntries(Object.entries(item).map(([key, cell]) => [key, cell && typeof cell === 'object' ? JSON.stringify(cell) : cell])) });
        }
      });
      return;
    }
    if (!value || typeof value !== 'object') return;
    Object.entries(value).forEach(([key, child]) => {
      if (['society', 'period'].includes(key)) return;
      if (Array.isArray(child)) walk(child, titleCase(key));
      else if (child && typeof child === 'object' && !(child instanceof Date)) walk(child, section);
    });
  };
  walk(data);
  if (rows.length) return rows;

  // Some reports (such as occupancy and residents) contain summary metrics
  // rather than a detail-row array. Keep those values in CSV exports too.
  const summaryRows = [];
  const collectSummary = (value, path = '') => {
    if (!value || typeof value !== 'object' || value instanceof Date || Array.isArray(value)) return;
    Object.entries(value).forEach(([key, child]) => {
      if (['society', 'period'].includes(key)) return;
      const label = path ? `${path} / ${titleCase(key)}` : titleCase(key);
      if (child && typeof child === 'object' && !(child instanceof Date)) collectSummary(child, label);
      else if (child !== undefined && child !== null) summaryRows.push({ Metric: label, Value: child });
    });
  };
  collectSummary(data);
  return summaryRows;
};


// --- PDF (tabular: one column per field of the detail rows) -----------------
const titleCase = (key) => String(key).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const readableLabel = (value) => titleCase(value)
  .replace(/\b(Ticket|Pass|Invoice|Purchase Order|Meter|Tracking|Quotation|Request) No\b/gi, '$1 Number')
  .replace(/\bCreated At\b/gi, 'Created On')
  .replace(/\bOpened At\b/gi, 'Opened On')
  .replace(/\bResolved At\b/gi, 'Resolved On')
  .replace(/\bClosed At\b/gi, 'Closed On')
  .replace(/\bSla(s?)\b/gi, (_match, plural) => plural ? 'Service deadlines' : 'Service deadline')
  .replace(/\bRfq(s?)\b/gi, (_match, plural) => plural ? 'Quotation requests' : 'Quotation request')
  .replace(/\bGrn(s?)\b/gi, (_match, plural) => plural ? 'Goods receipts' : 'Goods receipt')
  .replace(/^Service deadline Breaches$/i, 'Missed service deadlines')
  .replace(/\bPos\b/gi, 'Purchase orders')
  .replace(/\bPo No\b/gi, 'Purchase order number')
  .replace(/\bPo\b/gi, 'Purchase order')
  .replace(/\bUnit Of Measure\b/gi, 'Measurement unit')
  .replace(/\bCriteria Scores (\d+)\b/gi, 'Evaluation $1')
  .replace(/\s*\/\s*/g, ' - ');
const pdfIsId = (key) => /(^|_)(id|uuid|guid|fk|foreign_key)(_|$)/i.test(
  String(key).replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()
);
const pdfIsUuid = (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
const pdfCell = (value) => {
  if (value === null || value === undefined || pdfIsUuid(value)) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  let text = value instanceof Date ? value.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : String(value);
  if (/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/.test(text) && /_|^[A-Z]{3,}$/.test(text)) {
    text = text.toLowerCase().replace(/(^|_)([a-z])/g, (_match, prefix, letter) => `${prefix ? ' ' : ''}${letter.toUpperCase()}`);
  }
  return text.replace(/\u20B9/g, 'INR ').replace(/[\u2014\u2013]/g, '-');
};

const societyBranding = async (societyId) => {
  if (!societyId) return { name: 'Housing Society', logoPath: null };
  const society = await Society.findByPk(societyId, { attributes: ['name', 'logoUrl'] });
  const logoName = society?.logoUrl?.startsWith('/uploads/society-logos/') ? path.basename(society.logoUrl) : '';
  const logoPath = logoName ? path.join(process.cwd(), 'uploads', 'society-logos', logoName) : null;
  return {
    name: society?.name || 'Housing Society',
    // PDFKit handles PNG and JPEG. Unsupported/missing logo files fall back to
    // the society monogram without preventing the report download.
    logoPath: logoPath && /\.(png|jpe?g)$/i.test(logoPath) && fs.existsSync(logoPath) ? logoPath : null,
  };
};

// Compact, consistent PDF layout used by every report export. The API may
// return several overlapping breakdowns; when a canonical `rows` list exists,
// show that list only.
const compactPdfData = (data, maxRecords = 5000) => {
  const sections = [];
  const makeFields = (record) => {
    const fields = [];
    const walk = (value, prefix = '') => {
      if (Array.isArray(value)) {
        value.forEach((child, index) => walk(child, `${prefix} ${index + 1}`.trim()));
      } else if (value && typeof value === 'object' && !(value instanceof Date)) {
        Object.entries(value).forEach(([key, child]) => {
          if (!pdfIsId(key) && !/^(description|message|body|internal_notes)$/i.test(key)) {
            walk(child, prefix ? `${prefix} / ${key}` : key);
          }
        });
      } else if (prefix && !pdfIsUuid(value)) {
        fields.push({ label: readableLabel(prefix), value: pdfCell(value) });
      }
    };
    walk(record);
    return fields;
  };

  if (Array.isArray(data?.rows)) {
    sections.push({ title: 'Report records', total: data.rows.length, records: data.rows.slice(0, maxRecords) });
  } else {
    const collectArrays = (value, path = '') => {
      if (!value || typeof value !== 'object' || value instanceof Date) return;
      Object.entries(value).forEach(([key, child]) => {
        if (Array.isArray(child) && child.length) sections.push({ title: readableLabel(path ? `${path} / ${key}` : key), total: child.length, records: child.slice(0, maxRecords) });
        else if (child && typeof child === 'object' && !(child instanceof Date)) collectArrays(child, path ? `${path} / ${titleCase(key)}` : titleCase(key));
      });
    };
    collectArrays(data);

    // Aggregate-only reports have no arrays. Render their scalar metrics as
    // one summary record instead of producing an empty report document.
    if (!sections.length) {
      const summary = {};
      const collectSummary = (value, prefix = '') => {
        if (!value || typeof value !== 'object' || value instanceof Date || Array.isArray(value)) return;
        Object.entries(value).forEach(([key, child]) => {
          if (['society', 'period'].includes(key)) return;
          const label = prefix ? `${prefix} / ${titleCase(key)}` : titleCase(key);
          if (child && typeof child === 'object' && !(child instanceof Date)) collectSummary(child, label);
          else if (child !== undefined && child !== null) summary[label] = child;
        });
      };
      collectSummary(data);
      if (Object.keys(summary).length) sections.push({ title: 'Summary', total: 1, records: [summary] });
    }
  }
  return { sections: sections.map((section) => ({
    ...section,
    records: section.records.map(makeFields).filter((fields) => fields.length),
  })) };
};

const reportDescriptions = {
  dashboard: 'A snapshot of key society operations, including vehicles, visitors, helpdesk activity, vendors and utilities.',
  'legacy-executive': 'A high-level view of society activity and performance for the selected period.',
  'finance-dashboard': 'An overview of society income, expenses, collections and outstanding dues.',
  'bank-balance': 'Bank account balances and transactions recorded for the selected period.',
  collection: 'Maintenance and other payments collected from residents during the selected period.',
  arrears: 'Resident balances that remain unpaid, including overdue amounts.',
  'income-expense': 'Income received and expenses recorded by the society during the selected period.',
  'society-operations': 'An overview of residents, vehicles, occupancy and day-to-day society activity.',
  occupancy: 'Occupied and vacant homes in the society.',
  residents: 'Resident and household details recorded for the society.',
  'society-vehicles': 'Vehicles registered in the society, including their type, registration and linked flat.',
  parking: 'Parking space availability, usage and allocation for the society.',
  vehicles: 'Vehicles registered in the society, including their type, registration and linked flat.',
  visitors: 'Visitor passes created during the selected period, with visitor, gate and pass validity details.',
  'legacy-visitors': 'An overview of visitor activity and visitor profile totals for the society.',
  'gate-activity': 'Entry and exit activity recorded at society gates during the selected period.',
  'gate-summary': 'An overview of gate activity, including entries and exits by gate.',
  'staff-summary': 'Security and support staff counts and current work status.',
  'patrol-summary': 'Security patrol rounds and recorded checkpoints for the selected period.',
  overstay: 'Visitor passes that remained inside beyond the expected visit duration.',
  deliveries: 'Packages and courier deliveries received for society flats, including handover status.',
  tickets: 'Helpdesk requests raised by residents, including category, priority and current status.',
  'sla-breaches': 'Helpdesk requests that missed their expected response or resolution deadlines.',
  'approvals-dashboard': 'An overview of requests waiting for approval and their current progress.',
  'approval-details': 'Approval requests, decisions and related payment details.',
  'approval-status': 'Approval requests grouped by their current status.',
  'approval-sla': 'Approval requests that met or missed their expected processing deadlines.',
  'approval-payments': 'Payments linked to approved requests, including amounts and payment status.',
  'category-trends': 'Helpdesk request volumes grouped by category and month.',
  'vendor-outstanding': 'Vendor invoices, payments received and amounts still due.',
  'vendor-contracts': 'Vendor agreements, their values and upcoming expiry dates.',
  'vendor-spend': 'Purchase order and invoice spending grouped by vendor.',
  'vendor-sla-performance': 'Vendor-assigned helpdesk requests, completed work and missed deadlines.',
  'quotation-comparison': 'Vendor quotations and their prices and evaluation scores for the selected request.',
  'procurement-summary': 'Purchase requests, quotations, purchase orders and vendor bills for the selected period.',
  'purchase-orders': 'Purchase orders, delivery dates, costs and goods received from vendors.',
  'vendor-bills': 'Vendor invoices, related purchase orders, due dates and payment status.',
  'amenity-utilization': 'Amenity capacity and booking usage during the selected period.',
  'amenity-bookings': 'Amenity reservations, including the flat, date, time and booking status.',
  'utility-bills': 'Utility meter readings, consumption and bills during the selected period.',
};

const sendCompactPdf = (res, name, data, period, society) => {
  const { sections } = compactPdfData(data);
  const reportTitle = readableLabel(name);
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36, bufferPages: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.pdf"`);
  doc.pipe(res);

  const drawHeader = () => {
    const width = doc.page.width;
    doc.save();
    doc.rect(0, 0, width, 104).fill('#f3f6fc');
    if (society.logoPath) {
      try { doc.image(society.logoPath, 38, 20, { fit: [48, 48] }); } catch { /* use text fallback */ }
    } else {
      const initials = society.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'HS';
      doc.roundedRect(38, 20, 48, 48, 10).fill('#e8eaff');
      doc.fillColor('#5145cd').font('Helvetica-Bold').fontSize(15).text(initials, 38, 36, { width: 48, align: 'center' });
    }
    doc.fillColor('#17243a').font('Helvetica-Bold').fontSize(16).text(society.name, 100, 21, { width: width - 136, ellipsis: true });
    doc.fillColor('#596b85').font('Helvetica').fontSize(8).text('SOCIETY REPORT', 100, 44);
    doc.fillColor('#17243a').font('Helvetica-Bold').fontSize(12).text(reportTitle, 100, 59, { width: width - 136, ellipsis: true });
    const from = period?.fromDate || period?.from_date;
    const to = period?.toDate || period?.to_date;
    const dateRange = from || to ? `${from || 'Start'} to ${to || 'Today'}` : 'All dates';
    doc.fillColor('#596b85').font('Helvetica').fontSize(8).text(`Period: ${dateRange}  |  Generated ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, 100, 81, { width: width - 136, ellipsis: true });
    doc.restore();
    doc.y = 119;
    doc.x = doc.page.margins.left;
    const description = reportDescriptions[name] || `Detailed records for ${reportTitle.toLowerCase()} in this society.`;
    doc.fillColor('#46566f').font('Helvetica').fontSize(9).text(description, 38, doc.y, {
      width: doc.page.width - 76,
      lineGap: 2,
    });
    doc.y += 12;
  };
  drawHeader();

  // Keep report content and the footer inside PDFKit's printable page bounds.
  const bottom = () => doc.page.height - 64;
  const ensureSpace = (height) => { if (doc.y + height > bottom()) addContentPage(); };
  // Society branding and report details belong on the first page only.
  // Continuation pages start directly with their section or table headings.
  const addContentPage = () => {
    doc.addPage();
    doc.y = doc.page.margins.top;
    doc.x = doc.page.margins.left;
  };
  const sectionTitle = (title, subtitle = '') => {
    ensureSpace(32);
    const y = doc.y;
    doc.roundedRect(36, y, doc.page.width - 72, 23, 5).fill('#edf1ff');
    doc.fillColor('#5145cd').font('Helvetica-Bold').fontSize(9).text(title, 46, y + 7, { width: doc.page.width - 170, ellipsis: true });
    if (subtitle) doc.fillColor('#64748b').font('Helvetica').fontSize(8).text(subtitle, doc.page.width - 150, y + 7, { width: 102, align: 'right' });
    doc.y = y + 30;
  };
  const drawGrid = (items, columns, cardHeight, valueSize = 9) => {
    const gap = 10;
    const usableWidth = doc.page.width - 72;
    const cellWidth = (usableWidth - gap * (columns - 1)) / columns;
    for (let start = 0; start < items.length; start += columns) {
      const group = items.slice(start, start + columns);
      const heights = group.map((item) => {
        doc.font('Helvetica').fontSize(valueSize);
        const measured = doc.heightOfString(String(item.value ?? '-'), { width: cellWidth - 20, lineGap: 1 });
        return Math.max(cardHeight, measured + 30);
      });
      const rowHeight = Math.max(...heights);
      ensureSpace(rowHeight + 6);
      const y = doc.y;
      group.forEach((item, index) => {
        const x = 36 + index * (cellWidth + gap);
        doc.roundedRect(x, y, cellWidth, rowHeight, 6).lineWidth(0.6).strokeColor('#dfe5ef').stroke();
        doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(7).text(item.label, x + 10, y + 7, { width: cellWidth - 20, height: 15, ellipsis: true });
        doc.fillColor('#17243a').font('Helvetica-Bold').fontSize(valueSize).text(String(item.value ?? '-'), x + 10, y + 21, { width: cellWidth - 20, lineGap: 1 });
      });
      doc.y = y + rowHeight + 7;
    }
  };

  // Render details as a familiar table. Four data columns per table keep
  // headings and values readable even when a report has many fields.
  const drawRecordTable = (records) => {
    const labels = [...new Set(records.flatMap((fields) => fields.map((field) => field.label)))];
    const usableWidth = doc.page.width - 72;
    const recordWidth = 54;
    const dataWidth = (usableWidth - recordWidth) / 4;
    const recordColumn = { label: 'Record', width: recordWidth, getValue: (_fields, index) => String(index + 1) };
    const dataColumns = labels.map((label) => ({ label, width: dataWidth, getValue: (fields) => fields.find((field) => field.label === label)?.value || '-' }));
    const drawTableHeader = (chunk) => {
      const y = doc.y;
      const headerHeight = 25;
      doc.rect(36, y, usableWidth, headerHeight).fill('#edf1ff');
      let x = 36;
      chunk.forEach((column) => {
        doc.fillColor('#344563').font('Helvetica-Bold').fontSize(7)
          .text(column.label, x + 5, y + 6, { width: column.width - 10, height: headerHeight - 8, ellipsis: true });
        x += column.width;
      });
      doc.y = y + headerHeight;
    };
    for (let start = 0; start < dataColumns.length; start += 4) {
      // Each continuation table includes the record number so readers can
      // match additional fields to the same record.
      const chunk = [recordColumn, ...dataColumns.slice(start, start + 4)];
      if (doc.y + 25 > bottom()) addContentPage();
      drawTableHeader(chunk);
      records.forEach((fields, recordIndex) => {
        doc.font('Helvetica').fontSize(7.5);
        const rowHeight = Math.max(28, ...chunk.map((column) => doc.heightOfString(
          String(column.getValue(fields, recordIndex)),
          { width: column.width - 10, lineGap: 1 }
        ) + 10));
        if (doc.y + rowHeight > bottom()) {
          addContentPage();
          drawTableHeader(chunk);
        }
        const y = doc.y;
        if (recordIndex % 2 === 1) doc.rect(36, y, usableWidth, rowHeight).fill('#f8faff');
        let x = 36;
        chunk.forEach((column) => {
          doc.rect(x, y, column.width, rowHeight).lineWidth(0.45).strokeColor('#dfe5ef').stroke();
          doc.fillColor(column.label === 'Record' ? '#5145cd' : '#17243a')
            .font(column.label === 'Record' ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5)
            .text(String(column.getValue(fields, recordIndex)), x + 5, y + 5, { width: column.width - 10, lineGap: 1 });
          x += column.width;
        });
        doc.y = y + rowHeight;
      });
      doc.y += 12;
    }
  };

  sections.forEach((section) => {
    sectionTitle(section.title, `${section.total} total`);
    if (section.records.length) drawRecordTable(section.records);
    if (section.total > section.records.length) {
      ensureSpace(20);
      doc.fillColor('#64748b').font('Helvetica-Oblique').fontSize(8).text(`Showing ${section.records.length} of ${section.total} records to keep this report concise.`, 38, doc.y);
      doc.y += 18;
    }
  });
  if (!sections.length || sections.every((section) => !section.records.length)) {
    doc.fillColor('#64748b').font('Helvetica').fontSize(10).text('No report data is available for the selected filters.', 38, doc.y);
  }

  const range = doc.bufferedPageRange();
  for (let page = range.start; page < range.start + range.count; page += 1) {
    doc.switchToPage(page);
    doc.save();
    doc.strokeColor('#e1e6ef').lineWidth(0.6).moveTo(36, doc.page.height - 51).lineTo(doc.page.width - 36, doc.page.height - 51).stroke();
    doc.fillColor('#78869b').font('Helvetica').fontSize(8).text(`Page ${page - range.start + 1} of ${range.count}`, doc.page.width - 90, doc.page.height - 46, { width: 54, align: 'right' });
    doc.restore();
  }
  return doc.end();
};

// --- XLSX (tabular report records only) ------------------------------------
const sendXlsx = async (res, name, data) => {
  const { sections } = compactPdfData(data, 5000);
  const workbook = new ExcelJS.Workbook();
  const usedNames = new Set();
  sections.forEach((section, sectionIndex) => {
    const labels = [...new Set(section.records.flatMap((fields) => fields.map((field) => field.label)))];
    const friendlySectionTitle = readableLabel(section.title || `Details ${sectionIndex + 1}`);
    const baseName = friendlySectionTitle.replace(/[\\/*?:\[\]]/g, ' ').slice(0, 31).trim() || `Details ${sectionIndex + 1}`;
    let sheetName = baseName;
    let suffix = 2;
    while (usedNames.has(sheetName.toLowerCase())) {
      const ending = ` ${suffix++}`;
      sheetName = `${baseName.slice(0, 31 - ending.length)}${ending}`;
    }
    usedNames.add(sheetName.toLowerCase());
    const sheet = workbook.addWorksheet(sheetName);
    sheet.addRow(['Record', ...labels]);
    section.records.forEach((fields, index) => {
      const byLabel = new Map(fields.map((field) => [field.label, field.value]));
      sheet.addRow([String(index + 1), ...labels.map((label) => byLabel.get(label) || '-')]);
    });
    sheet.getRow(1).font = { bold: true, color: { argb: 'FF17243A' } };
    sheet.getRow(1).alignment = { vertical: 'middle', wrapText: true };
    sheet.getRow(1).height = 30;
    sheet.columns = [
      { width: 11 },
      ...labels.map((label, columnIndex) => {
        const longest = Math.max(label.length, ...section.records.slice(0, 100).map((fields) => String(fields.find((field) => field.label === label)?.value || '').length));
        return { width: Math.min(Math.max(longest + 2, 14), 36), key: `field_${columnIndex + 1}` };
      }),
    ];
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, section.records.length + 1), column: Math.max(1, labels.length + 1) } };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.eachRow((row, rowNumber) => {
      row.alignment = { vertical: 'top', wrapText: true };
      if (rowNumber > 1 && rowNumber % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FC' } };
      }
    });
  });
  if (!sections.length) {
    const sheet = workbook.addWorksheet('Report data');
    sheet.addRow(['No detail records for the selected report.']);
    sheet.getColumn(1).width = 42;
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
};

const exportReportData = asyncHandler(async (req, res) => {
  const { reportKey, format, fromDate, toDate, rfqId, expiringInDays, limit } = req.body;
  const societyId = resolveSocietyId(req);
  assertExportAllowed(req);
  const task = exportTasks[reportKey];
  if (!task) throw new ApiError(400, 'This report does not support export');
  if (!req.user.roles.includes('SUPER_ADMIN') && !req.user.permissions.includes(task.permission)) {
    throw new ApiError(403, 'You do not have permission to export this report');
  }

  const name = reportKey.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'report';
  const params = { societyId, fromDate, toDate, rfqId, expiringInDays, includeRows: true, limit: 5000 };
  const data = await task.run(params);
  const rows = exportRowsFromData(data);
  if (format === 'csv') return sendCsv(res, name, rows);
  if (format === 'pdf') return sendCompactPdf(res, name, data, data?.period || { fromDate, toDate }, await societyBranding(societyId));
  return sendXlsx(res, name, data);
});

/**
 * exportName omitted => the report has no flat table, so ?format=csv|pdf|xlsx is refused.
 * With ?format=csv, pdf or xlsx the service is asked for detail rows (includeRows) and the
 * caller must hold REPORT_EXPORT.
 */
const handler = (serviceFn, message, exportName) =>
  asyncHandler(async (req, res) => {
    const params = { ...req.query, societyId: resolveSocietyId(req) };
    const format = req.query.format;
    const exporting = ['csv', 'pdf', 'xlsx'].includes(format);
    if (exporting) {
      if (!exportName) throw new ApiError(400, 'CSV/PDF/XLSX export is not available for this report');
      assertExportAllowed(req);
      params.includeRows = true;
      params.limit = 5000;
    }
    const data = await serviceFn(params);
    if (format === 'csv') return sendCsv(res, exportName, data.rows);
    if (format === 'pdf') return sendCompactPdf(res, exportName, data, data.period, await societyBranding(params.societyId));
    if (format === 'xlsx') return sendXlsx(res, exportName, data);
    return ApiResponse.success(res, data, message);
  });

module.exports = {
  exportReportData,
  listProcurementRfqs: asyncHandler(async (req, res) => {
    const societyId = resolveSocietyId(req);
    const rfqs = await service.listProcurementRfqs(societyId);
    return ApiResponse.success(res, rfqs, 'Procurement RFQs loaded successfully');
  }),
  getDashboard: handler(service.getDashboard, 'Reports dashboard loaded successfully'),

  getVehicleReport: handler(service.getVehicleReport, 'Vehicle report loaded successfully', 'vehicles'),
  getParkingReport: handler(service.getParkingReport, 'Parking report loaded successfully'),

  getVisitorReport: handler(service.getVisitorReport, 'Visitor report loaded successfully', 'visitors'),
  getGateActivityReport: handler(service.getGateActivityReport, 'Gate activity report loaded successfully', 'gate-activity'),
  getOverstayReport: handler(service.getOverstayReport, 'Overstay report loaded successfully', 'overstay'),
  getDeliveryReport: handler(service.getDeliveryReport, 'Delivery report loaded successfully', 'deliveries'),

  getTicketReport: handler(service.getTicketReport, 'Helpdesk ticket report loaded successfully', 'tickets'),
  getSlaReport: handler(service.getSlaReport, 'SLA report loaded successfully', 'sla-breaches'),
  getCategoryTrends: handler(service.getCategoryTrends, 'Category trends loaded successfully', 'category-trends'),

  getVendorOutstanding: handler(service.getVendorOutstanding, 'Vendor outstanding report loaded successfully', 'vendor-outstanding'),
  getVendorContracts: handler(service.getVendorContracts, 'Vendor contract report loaded successfully', 'vendor-contracts'),
  getVendorSpend: handler(service.getVendorSpend, 'Vendor spend report loaded successfully', 'vendor-spend'),
  getVendorSlaPerformance: handler(service.getVendorSlaPerformance, 'Vendor SLA performance loaded successfully', 'vendor-sla-performance'),

  getProcurementSummary: handler(service.getProcurementSummary, 'Procurement summary loaded successfully'),
  getQuotationComparison: handler(service.getQuotationComparison, 'Quotation comparison loaded successfully', 'quotation-comparison'),
  getPurchaseOrderReport: handler(service.getPurchaseOrderReport, 'Purchase order report loaded successfully', 'purchase-orders'),
  getVendorBillReport: handler(service.getVendorBillReport, 'Vendor bill report loaded successfully', 'vendor-bills'),

  getAmenityUtilization: handler(service.getAmenityUtilization, 'Amenity utilization loaded successfully', 'amenity-utilization'),
  getAmenityBookings: handler(service.getAmenityBookings, 'Amenity booking report loaded successfully', 'amenity-bookings'),

  getUtilitySummary: handler(service.getUtilitySummary, 'Utility summary loaded successfully', 'utility-bills'),
};
