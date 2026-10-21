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
const pdfCell = (value) => {
  if (value === null || value === undefined) return '';
  const text = value instanceof Date ? value.toISOString().slice(0, 16).replace('T', ' ') : String(value);
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
};
const titleCase = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const sendPdf = (res, name, rows, period) => {
  const list = rows || [];
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.pdf"`);
  doc.pipe(res);

  const range = period && (period.fromDate || period.toDate)
    ? `${period.fromDate || 'start'} to ${period.toDate || 'today'}` : 'all dates';
  doc.font('Helvetica-Bold').fontSize(14).text(titleCase(name.replace(/-/g, '_')));
  doc.font('Helvetica').fontSize(8).text(`Generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC  |  Period: ${range}  |  Rows: ${list.length}`);
  doc.moveDown();

  if (!list.length) {
    doc.fontSize(10).text('No data for the selected filters.');
    return doc.end();
  }

  const headers = Object.keys(list[0]);
  const colWidth = (doc.page.width - 60) / headers.length;
  const bottom = () => doc.page.height - doc.page.margins.bottom;

  const drawRow = (cells, bold, allowBreak = true) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7);
    const height = Math.max(...cells.map((c) => doc.heightOfString(c, { width: colWidth - 4 }))) + 4;
    if (allowBreak && doc.y + height > bottom()) {
      doc.addPage();
      drawRow(headers.map(titleCase), true, false);
    }
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7); // reset after a header redraw
    const y = doc.y;
    cells.forEach((cell, i) => doc.text(cell, 30 + i * colWidth, y, { width: colWidth - 4 }));
    doc.x = 30;
    doc.y = y + height;
  };

  drawRow(headers.map(titleCase), true, false);
  list.forEach((row) => drawRow(headers.map((h) => pdfCell(row[h])), false));
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
      value.slice(0, 5000 - detailRows.length).forEach((item) => {
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
  const rows = [...summaryRows, ...detailRows].slice(0, 5000);
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
  const params = { societyId, fromDate, toDate, rfqId, expiringInDays, includeRows: true, limit: limit || 500 };
  const data = await task.run(params);
  const rows = exportRowsFromData(data);
  if (format === 'csv') return sendCsv(res, name, rows);
  if (format === 'pdf') return sendPdf(res, name, rows, data?.period || { fromDate, toDate });
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
    }
    const data = await serviceFn(params);
    if (format === 'csv') return sendCsv(res, exportName, data.rows);
    if (format === 'pdf') return sendPdf(res, exportName, data.rows, data.period);
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
