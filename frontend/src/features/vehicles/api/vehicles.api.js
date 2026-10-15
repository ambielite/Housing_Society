import api from '../../../lib/axios';

const unwrap = (response) => response.data.data;

// The backend rejects empty-string filters, so drop anything blank before sending.
const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));

// --- vehicles (list returns { vehicles, pagination }) ---
export const listVehicles = (params) => api.get('/vehicles', { params: clean(params) }).then(unwrap);
export const getVehicle = (id) => api.get(`/vehicles/${id}`).then(unwrap);
export const createVehicle = (payload) => api.post('/vehicles', payload).then(unwrap);
export const updateVehicle = (id, payload) => api.patch(`/vehicles/${id}`, payload).then(unwrap);
export const updateVehicleStatus = (id, status) => api.patch(`/vehicles/${id}/status`, { status }).then(unwrap);

// --- access credentials (RFID / sticker / QR) ---
export const listCredentials = (vehicleId) => api.get(`/vehicles/${vehicleId}/credentials`).then(unwrap);
export const assignCredential = (vehicleId, payload) => api.post(`/vehicles/${vehicleId}/credentials`, payload).then(unwrap);
export const revokeCredential = (vehicleId, credentialId) =>
  api.delete(`/vehicles/${vehicleId}/credentials/${credentialId}`).then(unwrap);

// --- gate log (parking visits) ---
export const listVisits = (params) => api.get('/vehicles/visits', { params: clean(params) }).then(unwrap);
export const logEntry = (payload) => api.post('/vehicles/visits/entry', payload).then(unwrap);
export const logExit = (visitId) => api.patch(`/vehicles/visits/${visitId}/exit`).then(unwrap);
