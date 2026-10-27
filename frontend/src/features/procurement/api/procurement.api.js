import api from '../../../lib/axios';

const unwrap = (response) => response.data.data;

// The backend rejects empty-string filters, so drop anything blank before sending.
const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));

// --- purchase requests ---
export const listRequests = (params) => api.get('/procurement/requests', { params: clean(params) }).then(unwrap);
export const getRequest = (id) => api.get(`/procurement/requests/${id}`).then(unwrap); // includes .lines
export const createRequest = (payload) => api.post('/procurement/requests', payload).then(unwrap);
export const updateRequestStatus = (id, status) => api.patch(`/procurement/requests/${id}/status`, { status }).then(unwrap);
export const deleteRequest = (id) => api.delete(`/procurement/requests/${id}`).then(unwrap);
export const addRequestLine = (id, payload) => api.post(`/procurement/requests/${id}/lines`, payload).then(unwrap);

// --- RFQs ---
export const listRfqs = (requestId) => api.get(`/procurement/requests/${requestId}/rfqs`).then(unwrap);
export const getRfq = (id) => api.get(`/procurement/rfqs/${id}`).then(unwrap); // includes .invitedVendors
export const createRfq = (payload) => api.post('/procurement/rfqs', payload).then(unwrap);
export const closeRfq = (id) => api.patch(`/procurement/rfqs/${id}/close`).then(unwrap);
export const inviteVendor = (rfqId, vendorId) => api.post(`/procurement/rfqs/${rfqId}/vendors`, { vendorId }).then(unwrap);

// --- quotations ---
export const listQuotations = (rfqId) => api.get(`/procurement/rfqs/${rfqId}/quotations`).then(unwrap);
export const getQuotation = (id) => api.get(`/procurement/quotations/${id}`).then(unwrap); // includes .lines
export const submitQuotation = (payload, document = null) => {
  if (!document) return api.post('/procurement/quotations', payload).then(unwrap);
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== null && value !== undefined) form.append(key, value);
  });
  form.append('document', document);
  return api.post('/procurement/quotations', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap);
};
export const downloadQuotationDocument = (id) => api.get(`/procurement/quotations/${id}/document`, { responseType: 'blob' });
export const addQuotationLine = (id, payload) => api.post(`/procurement/quotations/${id}/lines`, payload).then(unwrap); // returns the quotation with fresh totals
export const decideQuotation = (id, status) => api.patch(`/procurement/quotations/${id}/decide`, { status }).then(unwrap);

// --- comparison scores ---
export const listComparisons = (rfqId) => api.get(`/procurement/rfqs/${rfqId}/comparisons`).then(unwrap);
export const addComparison = (rfqId, payload) => api.post(`/procurement/rfqs/${rfqId}/comparisons`, payload).then(unwrap);
