import api from '../../../lib/axios';

const unwrap = (response) => response.data.data;

// The backend rejects empty-string filters, so drop anything blank before sending.
const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));

// --- areas ---
export const listAreas = (params) => api.get('/parking/areas', { params: clean(params) }).then(unwrap);
export const createArea = (payload) => api.post('/parking/areas', payload).then(unwrap);
export const updateArea = (id, payload) => api.put(`/parking/areas/${id}`, payload).then(unwrap);
export const deleteArea = (id) => api.delete(`/parking/areas/${id}`).then(unwrap);

// --- slots ---
export const listSlots = (params) => api.get('/parking/slots', { params: clean(params) }).then(unwrap);
export const createSlot = (payload) => api.post('/parking/slots', payload).then(unwrap);
export const updateSlot = (id, payload) => api.put(`/parking/slots/${id}`, payload).then(unwrap);
export const deleteSlot = (id) => api.delete(`/parking/slots/${id}`).then(unwrap);

// --- allocations ---
export const listAllocations = (params) => api.get('/parking/allocations', { params: clean(params) }).then(unwrap);
export const createAllocation = (payload) => api.post('/parking/allocations', payload).then(unwrap);
export const endAllocation = (id, payload) => api.patch(`/parking/allocations/${id}/end`, payload).then(unwrap);
export const deleteAllocation = (id) => api.delete(`/parking/allocations/${id}`).then(unwrap);
