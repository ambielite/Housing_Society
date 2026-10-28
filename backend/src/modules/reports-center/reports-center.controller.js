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


// --- PDF (tabular: one column per field of the detail rows) -----------------
const titleCase = (key) => String(key).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const pdfIsId = (key) => /(^|_)(id|uuid|guid)($|_)/i.test(String(key).replace(/([a-z0-9])([A-Z])/g, '$1_$2'));
const pdfIsUuid = (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
const pdfCell = (value) => {
  if (value === null || value === undefined || pdfIsUuid(value)) return '-';
  const text = value instanceof Date ? value.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : String(value);
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
// show that list and the report's summary only.
const compactPdfData = (data, maxRecords = 100) => {
  const summary = [];
  const sections = [];
  const ignoredSummary = new Set(['society', 'period', 'rows', 'generatedAt', 'responseTimeDefinition', 'utilizationNote']);
  const visitSummary = (value, prefix = '') => {
    if (!value || typeof value !== 'object' || value instanceof Date || Array.isArray(value)) return;
    Object.entries(value).forEach(([key, child]) => {
      if (!prefix && ignoredSummary.has(key)) return;
      const label = prefix ? `${prefix} / ${titleCase(key)}` : titleCase(key);
      if (child && typeof child === 'object' && !Array.isArray(child) && !(child instanceof Date)) visitSummary(child, label);
      else if (!Array.isArray(child) && child !== undefined && !pdfIsUuid(child)) summary.push({ label, value: pdfCell(child) });
    });
  };
  const makeFields = (record) => {
    const fields = [];
    const walk = (value, prefix = '') => {
      if (Array.isArray(value)) {
        value.forEach((child, index) => walk(child, `${prefix} ${index + 1}`.trim()));
      } else if (value && typeof value === 'object' && !(value instanceof Date)) {
        Object.entries(value).forEach(([key, child]) => {
          if (!pdfIsId(key) && !/^(description|message|body|internal_notes)$/i.test(key)) {
            walk(child, prefix ? `${prefix} / ${titleCase(key)}` : titleCase(key));
          }
        });
      } else if (prefix && !pdfIsUuid(value)) {
        let text = pdfCell(value);
        if (text.length > 180) text = `${text.slice(0, 177)}...`;
        fields.push({ label: prefix, value: text });
      }
    };
    walk(record);
    return fields;
  };

  visitSummary(data);
  if (Array.isArray(data?.rows)) {
    sections.push({ title: 'Report records', total: data.rows.length, records: data.rows.slice(0, maxRecords) });
  } else {
    const collectArrays = (value, path = '') => {
      if (!value || typeof value !== 'object' || value instanceof Date) return;
      Object.entries(value).forEach(([key, child]) => {
        if (Array.isArray(child) && child.length) sections.push({ title: titleCase(path ? `${path} / ${key}` : key), total: child.length, records: child.slice(0, 25) });
        else if (child && typeof child === 'object' && !(child instanceof Date)) collectArrays(child, path ? `${path} / ${titleCase(key)}` : titleCase(key));
      });
    };
    collectArrays(data);
  }
  return { summary, sections: sections.map((section) => ({
    ...section,
    records: section.records.map(makeFields).filter((fields) => fields.length),
  })) };
};

const sendCompactPdf = (res, name, data, period, society) => {
  const { summary, sections } = compactPdfData(data);
  const reportTitle = titleCase(name.replace(/-/g, '_'));
  const recordCount = sections.reduce((total, section) => total + section.records.length, 0);
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
  };
  drawHeader();

  // Keep report content and the footer inside PDFKit's printable page bounds.
  const bottom = () => doc.page.height - 64;
  const ensureSpace = (height) => { if (doc.y + height > bottom()) doc.addPage(); };
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

  if (summary.length) {
    sectionTitle('Summary');
    drawGrid(summary, 3, 42, 9);
  }
  sections.forEach((section) => {
    sectionTitle(section.title, `${section.total} total`);
    section.records.forEach((fields, index) => {
      const recordName = fields.find((field) => /^(Name|Number|Request|Ticket|Vehicle|Vendor|Booking|PO No|Invoice No|Tracking No)$/i.test(field.label));
      ensureSpace(26);
      doc.fillColor('#17243a').font('Helvetica-Bold').fontSize(8.5).text(recordName ? `${index + 1}. ${recordName.value}` : `Record ${index + 1}`, 38, doc.y);
      doc.y += 14;
      drawGrid(fields, 3, 38, 8.5);
      doc.y += 5;
    });
    if (section.total > section.records.length) {
      ensureSpace(20);
      doc.fillColor('#64748b').font('Helvetica-Oblique').fontSize(8).text(`Showing ${section.records.length} of ${section.total} records to keep this report concise.`, 38, doc.y);
      doc.y += 18;
    }
  });
  if (!summary.length && !recordCount) {
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

// --- XLSX (numbers stay numeric; text is stored as text, never as a formula) -
const sendXlsx = async (res, name, rows) => {
  const list = rows || [];
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(name.slice(0, 31));
  const headers = list.length ? Object.keys(list[0]) : [];
  sheet.columns = headers.map((h) => ({ header: titleCase(h), key: h, width: Math.min(Math.max(h.length + 6, 14), 40) }));
  list.forEach((row) => sheet.addRow(headers.reduce((acc, h) => ({ ...acc, [h]: row[h] === undefined ? null : row[h] }), {})));
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
};

const exportRowsFromData = (data) => {
  const detailRows = [];
  const summaryRows = [];
  const toCell = (value) => value && typeof value === 'object' ? JSON.stringify(value) : value;
  const walk = (value, path = '') => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          detailRows.push({ section: path || 'Details', ...Object.fromEntries(Object.entries(item).map(([key, cell]) => [key, toCell(cell)])) });
        } else {
          detailRows.push({ section: path || 'Details', value: toCell(item) });
        }
      });
      return;
    }
    if (!value || typeof value !== 'object') return;
    Object.entries(value).forEach(([key, child]) => {
      if (['society', 'period'].includes(key)) return;
      const nextPath = path ? `${path}.${key}` : key;
      if (Array.isArray(child)) walk(child, key);
      else if (child && typeof child === 'object') walk(child, nextPath);
      else if (child !== undefined) summaryRows.push({ section: path || 'Summary', label: nextPath, value: toCell(child) });
    });
  };

  walk(data);
  const rows = [...summaryRows, ...detailRows];
  return rows.length ? rows : [{ message: 'No data for the selected filters.' }];
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
  return sendXlsx(res, name, rows);
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
    if (format === 'xlsx') return sendXlsx(res, exportName, data.rows);
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
