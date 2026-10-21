const express = require('express');
const controller = require('./reports-center.controller');
const validate = require('../../common/validate');
const {
  reportQuerySchema,
  contractsQuerySchema,
  quotationComparisonQuerySchema,
  dashboardQuerySchema,
  reportDataExportSchema,
} = require('./reports-center.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();
router.use(authenticate);

const q = validate(reportQuerySchema, 'query');

router.post('/export', validate(reportDataExportSchema, 'body'), controller.exportReportData);

// Dashboard widgets
router.get('/dashboard', authorize('REPORT_DASHBOARD_READ'), validate(dashboardQuerySchema, 'query'), controller.getDashboard);

// Operations
router.get('/operations/vehicles', authorize('REPORT_OPERATIONS_READ'), q, controller.getVehicleReport);
router.get('/operations/parking', authorize('REPORT_OPERATIONS_READ'), q, controller.getParkingReport);

// Security
router.get('/security/visitors', authorize('REPORT_SECURITY_READ'), q, controller.getVisitorReport);
router.get('/security/gate-activity', authorize('REPORT_SECURITY_READ'), q, controller.getGateActivityReport);
router.get('/security/overstay', authorize('REPORT_SECURITY_READ'), q, controller.getOverstayReport);
router.get('/security/deliveries', authorize('REPORT_SECURITY_READ'), q, controller.getDeliveryReport);

// Helpdesk
router.get('/helpdesk/tickets', authorize('REPORT_HELPDESK_READ'), q, controller.getTicketReport);
router.get('/helpdesk/sla', authorize('REPORT_HELPDESK_READ'), q, controller.getSlaReport);
router.get('/helpdesk/category-trends', authorize('REPORT_HELPDESK_READ'), q, controller.getCategoryTrends);

// Vendors
router.get('/vendors/outstanding', authorize('REPORT_VENDOR_READ'), q, controller.getVendorOutstanding);
router.get('/vendors/contracts', authorize('REPORT_VENDOR_READ'), validate(contractsQuerySchema, 'query'), controller.getVendorContracts);
router.get('/vendors/spend', authorize('REPORT_VENDOR_READ'), q, controller.getVendorSpend);
router.get('/vendors/sla-performance', authorize('REPORT_VENDOR_READ'), q, controller.getVendorSlaPerformance);

// Procurement
router.get('/procurement/summary', authorize('REPORT_PROCUREMENT_READ'), q, controller.getProcurementSummary);
router.get('/procurement/rfqs', authorize('REPORT_PROCUREMENT_READ'), q, controller.listProcurementRfqs);
router.get(
  '/procurement/quotation-comparison',
  authorize('REPORT_PROCUREMENT_READ'),
  validate(quotationComparisonQuerySchema, 'query'),
  controller.getQuotationComparison
);
router.get('/procurement/purchase-orders', authorize('REPORT_PROCUREMENT_READ'), q, controller.getPurchaseOrderReport);
router.get('/procurement/vendor-bills', authorize('REPORT_PROCUREMENT_READ'), q, controller.getVendorBillReport);

// Amenities
router.get('/amenities/utilization', authorize('REPORT_AMENITY_READ'), q, controller.getAmenityUtilization);
router.get('/amenities/bookings', authorize('REPORT_AMENITY_READ'), q, controller.getAmenityBookings);

// Utilities
router.get('/utilities/summary', authorize('REPORT_UTILITY_READ'), q, controller.getUtilitySummary);

module.exports = router;
