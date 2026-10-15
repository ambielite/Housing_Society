import api from '../../../lib/axios';

const clean = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined && value !== false)
);

const get = (path, params = {}, responseType) => api.get(`/reports-center${path}`, {
  params: clean(params),
  ...(responseType ? { responseType } : {}),
});
const data = (request) => request.then((response) => response.data.data);

// Executive dashboard
export const getDashboard = (params = {}) => data(get('/dashboard', params));
// Operations
export const getVehicleReport = (params = {}) => data(get('/operations/vehicles', params));
export const getParkingReport = (params = {}) => data(get('/operations/parking', params));
// Security
export const getVisitorReport = (params = {}) => data(get('/security/visitors', params));
export const getGateActivityReport = (params = {}) => data(get('/security/gate-activity', params));
export const getOverstayReport = (params = {}) => data(get('/security/overstay', params));
export const getDeliveryReport = (params = {}) => data(get('/security/deliveries', params));
// Helpdesk
export const getTicketReport = (params = {}) => data(get('/helpdesk/tickets', params));
export const getSlaReport = (params = {}) => data(get('/helpdesk/sla', params));
export const getCategoryTrends = (params = {}) => data(get('/helpdesk/category-trends', params));
// Vendors
export const getVendorOutstanding = (params = {}) => data(get('/vendors/outstanding', params));
export const getVendorContracts = (params = {}) => data(get('/vendors/contracts', params));
export const getVendorSpend = (params = {}) => data(get('/vendors/spend', params));
export const getVendorSlaPerformance = (params = {}) => data(get('/vendors/sla-performance', params));
// Procurement
export const getProcurementSummary = (params = {}) => data(get('/procurement/summary', params));
export const getQuotationComparison = (params = {}) => data(get('/procurement/quotation-comparison', params));
export const getPurchaseOrderReport = (params = {}) => data(get('/procurement/purchase-orders', params));
export const getVendorBillReport = (params = {}) => data(get('/procurement/vendor-bills', params));
// Amenities
export const getAmenityUtilization = (params = {}) => data(get('/amenities/utilization', params));
export const getAmenityBookings = (params = {}) => data(get('/amenities/bookings', params));
// Utilities
export const getUtilitySummary = (params = {}) => data(get('/utilities/summary', params));

const downloadNames = {
  vehicles: getVehicleReport,
  visitors: getVisitorReport,
  'gate-activity': getGateActivityReport,
  overstay: getOverstayReport,
  deliveries: getDeliveryReport,
  tickets: getTicketReport,
  'sla-breaches': getSlaReport,
  'category-trends': getCategoryTrends,
  'vendor-outstanding': getVendorOutstanding,
  'vendor-contracts': getVendorContracts,
  'vendor-spend': getVendorSpend,
  'vendor-sla-performance': getVendorSlaPerformance,
  'quotation-comparison': getQuotationComparison,
  'purchase-orders': getPurchaseOrderReport,
  'vendor-bills': getVendorBillReport,
  'amenity-utilization': getAmenityUtilization,
  'amenity-bookings': getAmenityBookings,
  'utility-bills': getUtilitySummary,
};

/** Export uses the same documented report endpoint with format=csv|pdf|xlsx. */
export const downloadReport = (reportKey, params = {}, format = 'csv') => {
  const request = downloadNames[reportKey];
  if (!request) throw new Error('Export is not available for this report.');
  const pathByKey = {
    vehicles: '/operations/vehicles', visitors: '/security/visitors', 'gate-activity': '/security/gate-activity',
    overstay: '/security/overstay', deliveries: '/security/deliveries', tickets: '/helpdesk/tickets',
    'sla-breaches': '/helpdesk/sla', 'category-trends': '/helpdesk/category-trends',
    'vendor-outstanding': '/vendors/outstanding', 'vendor-contracts': '/vendors/contracts',
    'vendor-spend': '/vendors/spend', 'vendor-sla-performance': '/vendors/sla-performance',
    'quotation-comparison': '/procurement/quotation-comparison', 'purchase-orders': '/procurement/purchase-orders',
    'vendor-bills': '/procurement/vendor-bills', 'amenity-utilization': '/amenities/utilization',
    'amenity-bookings': '/amenities/bookings', 'utility-bills': '/utilities/summary',
  };
  return get(pathByKey[reportKey], { ...params, format }, 'blob');
};
