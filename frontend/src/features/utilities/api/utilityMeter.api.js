import api from '../../../lib/axios';

const unwrap = (response) => response.data.data;
const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined));

// Setup: utility types
export const listUtilityTypes = (params = {}) => api.get('/utilities/types', { params: clean(params) }).then(unwrap);
export const getUtilityType = (id) => api.get(`/utilities/types/${id}`).then(unwrap);
export const createUtilityType = (payload) => api.post('/utilities/types', payload).then(unwrap);
export const updateUtilityType = (id, payload) => api.put(`/utilities/types/${id}`, payload).then(unwrap);
export const deleteUtilityType = (id) => api.delete(`/utilities/types/${id}`).then(unwrap);

// Setup: meters
export const listMeters = (params = {}) => api.get('/utilities/meters', { params: clean(params) }).then(unwrap);
export const getMeter = (id) => api.get(`/utilities/meters/${id}`).then(unwrap);
export const createMeter = (payload) => api.post('/utilities/meters', payload).then(unwrap);
export const updateMeter = (id, payload) => api.put(`/utilities/meters/${id}`, payload).then(unwrap);
export const deleteMeter = (id) => api.delete(`/utilities/meters/${id}`).then(unwrap);
export const replaceMeter = (id, payload) => api.post(`/utilities/meters/${id}/replace`, payload).then(unwrap);

// Setup: tariffs
export const createTariff = (payload) => api.post('/utilities/tariffs', payload).then(unwrap);
export const listTariffs = (utilityTypeId) => api.get(`/utilities/types/${utilityTypeId}/tariffs`).then(unwrap);
export const updateTariff = (id, payload) => api.put(`/utilities/tariffs/${id}`, payload).then(unwrap);
export const deleteTariff = (id) => api.delete(`/utilities/tariffs/${id}`).then(unwrap);

// Readings
export const listReadings = (params = {}) => api.get('/meter-readings', { params: clean(params) }).then(unwrap);
export const getReading = (id) => api.get(`/meter-readings/${id}`).then(unwrap);
export const submitReading = (payload) => api.post('/meter-readings', payload).then(unwrap);
export const submitEstimatedReading = (payload) => api.post('/meter-readings/estimate', payload).then(unwrap);
export const submitBulkReadings = (readings) => api.post('/meter-readings/bulk', { readings }).then(unwrap);
export const validateReading = (id) => api.patch(`/meter-readings/${id}/validate`).then(unwrap);
// Backend reference validation schema calls this field "remarks".
export const rejectReading = (id, remarks) => api.patch(`/meter-readings/${id}/reject`, { remarks }).then(unwrap);
export const adjustReading = (id, actualValue) => api.patch(`/meter-readings/${id}/adjust`, { actualValue }).then(unwrap);

// Utility bills
export const createBill = (readingId) => api.post('/meter-readings/bills', { readingId }).then(unwrap);
export const listBillsForMeter = (meterId) => api.get(`/meter-readings/bills/meter/${meterId}`).then(unwrap);
export const getBill = (billId) => api.get(`/meter-readings/bills/${billId}`).then(unwrap);
export const linkBill = (billId, payload) => api.patch(`/meter-readings/bills/${billId}/link`, clean(payload)).then(unwrap);
