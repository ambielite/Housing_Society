import api from '../../../lib/axios';

const unwrap = (response) => response.data.data;
const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));

// Reference data used by Phase 9 forms.
export const listUsers = (params) => api.get('/users', { params: clean(params) }).then(unwrap);
export const listVendors = (params) => api.get('/vendors', { params: clean(params) }).then(unwrap);

// Gates
export const listGates = () => api.get('/gates').then(unwrap);
export const getGate = (id) => api.get(`/gates/${id}`).then(unwrap);
export const createGate = (payload) => api.post('/gates', payload).then(unwrap);
export const updateGate = (id, payload) => api.put(`/gates/${id}`, payload).then(unwrap);
export const deleteGate = (id) => api.delete(`/gates/${id}`).then(unwrap);
export const listGateDevices = (gateId) => api.get(`/gates/${gateId}/devices`).then(unwrap);

// Guards
export const createGuard = (payload) => api.post('/gates/guards', payload).then(unwrap);
export const listGuards = (params) => api.get('/gates/guards', { params: clean(params) }).then(unwrap);
export const getGuard = (id) => api.get(`/gates/guards/${id}`).then(unwrap);
export const updateGuard = (id, payload) => api.patch(`/gates/guards/${id}`, payload).then(unwrap);
export const deleteGuard = (id) => api.delete(`/gates/guards/${id}`).then(unwrap);

// Access cards
export const issueAccessCard = (payload) => api.post('/gates/access-cards', payload).then(unwrap);
export const listAccessCards = (params) => api.get('/gates/access-cards', { params: clean(params) }).then(unwrap);
export const getAccessCard = (id) => api.get(`/gates/access-cards/${id}`).then(unwrap);
export const revokeAccessCard = (id) => api.patch(`/gates/access-cards/${id}/revoke`).then(unwrap);

// Devices / device events
export const createGateDevice = (payload) => api.post('/gates/devices', payload).then(unwrap);
export const getGateDevice = (id) => api.get(`/gates/devices/${id}`).then(unwrap);
export const updateGateDevice = (id, payload) => api.patch(`/gates/devices/${id}`, payload).then(unwrap);
export const ingestDeviceEvent = (id, payload) => api.post(`/gates/devices/${id}/events`, payload).then(unwrap);
export const listDeviceEvents = (id) => api.get(`/gates/devices/${id}/events`).then(unwrap);

// Visitor profiles
export const createVisitorProfile = (payload) => api.post('/visitors/profiles', payload).then(unwrap);
export const listVisitorProfiles = (params) => api.get('/visitors/profiles', { params: clean(params) }).then(unwrap);
export const getVisitorProfile = (id) => api.get(`/visitors/profiles/${id}`).then(unwrap);
export const updateVisitorProfile = (id, payload) => api.patch(`/visitors/profiles/${id}`, payload).then(unwrap);
export const setBlacklistStatus = (id, blacklistStatus) =>
  api.patch(`/visitors/profiles/${id}/blacklist`, { blacklistStatus }).then(unwrap);

// Visitor invites
export const createVisitorInvite = (payload) => api.post('/visitors/invites', payload).then(unwrap);
export const listVisitorInvites = (params) => api.get('/visitors/invites', { params: clean(params) }).then(unwrap);
export const getVisitorInvite = (id) => api.get(`/visitors/invites/${id}`).then(unwrap);
export const decideVisitorInvite = (id, status) =>
  api.patch(`/visitors/invites/${id}/decide`, { status }).then(unwrap);

// Visitor passes
export const createVisitorPass = (payload) => api.post('/visitors/passes', payload).then(unwrap);
export const listVisitorPasses = (params) => api.get('/visitors/passes', { params: clean(params) }).then(unwrap);
export const getVisitorPass = (id) => api.get(`/visitors/passes/${id}`).then(unwrap);
export const recordArrival = (id) => api.patch(`/visitors/passes/${id}/arrival`).then(unwrap);
export const recordEntry = (id, capturedBy) => api.patch(`/visitors/passes/${id}/entry`, { capturedBy }).then(unwrap);
export const recordExit = (id, capturedBy) => api.patch(`/visitors/passes/${id}/exit`, { capturedBy }).then(unwrap);
export const cancelVisitorPass = (id) => api.patch(`/visitors/passes/${id}/cancel`).then(unwrap);
export const triggerOverstay = (id, durationMinutes) =>
  api.post(`/visitors/passes/${id}/overstay`, { durationMinutes }).then(unwrap);

// Visitor audit / overstay
export const listGateEvents = (params) => api.get('/visitors/gate-events', { params: clean(params) }).then(unwrap);
export const listOverstayAlerts = (params) => api.get('/visitors/overstay-alerts', { params: clean(params) }).then(unwrap);
export const acknowledgeOverstayAlert = (id, status) =>
  api.patch(`/visitors/overstay-alerts/${id}`, { status }).then(unwrap);

// Deliveries
export const listDeliveries = (params) => api.get('/deliveries', { params: clean(params) }).then(unwrap);
export const createDelivery = (payload) => api.post('/deliveries', payload).then(unwrap);
export const getDelivery = (id) => api.get(`/deliveries/${id}`).then(unwrap);
export const updateDeliveryStatus = (id, payload) => api.patch(`/deliveries/${id}/status`, payload).then(unwrap);

// Parcels
export const listParcels = (params) => api.get('/deliveries/parcels', { params: clean(params) }).then(unwrap);
export const createParcel = (payload) => api.post('/deliveries/parcels', payload).then(unwrap);
export const getParcel = (id) => api.get(`/deliveries/parcels/${id}`).then(unwrap);
export const updateParcelStatus = (id, status, collectedBy) =>
  api.patch(`/deliveries/parcels/${id}/status`, { status, collectedBy }).then(unwrap);
