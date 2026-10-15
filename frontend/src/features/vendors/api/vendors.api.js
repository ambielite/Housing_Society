import api from '../../../lib/axios';

const unwrap = (response) => response.data.data;

// The backend rejects empty-string filters, so drop anything blank before sending.
const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));

// --- vendors (list returns { vendors, pagination }) ---
export const listVendors = (params) => api.get('/vendors', { params: clean(params) }).then(unwrap);
export const getVendor = (id) => api.get(`/vendors/${id}`).then(unwrap);
export const createVendor = (payload) => api.post('/vendors', payload).then(unwrap);
export const updateVendor = (id, payload) => api.patch(`/vendors/${id}`, payload).then(unwrap);
export const updateVendorStatus = (id, status) => api.patch(`/vendors/${id}/status`, { status }).then(unwrap);
export const deleteVendor = (id) => api.delete(`/vendors/${id}`).then(unwrap);

// Existing user accounts linked to a vendor (supports multiple users per vendor).
export const listVendorUsers = (vendorId) => api.get(`/vendors/${vendorId}/users`).then(unwrap);
export const linkVendorUser = (vendorId, userId) => api.post(`/vendors/${vendorId}/users`, { userId }).then(unwrap);
export const unlinkVendorUser = (vendorId, userId) => api.delete(`/vendors/${vendorId}/users/${userId}`).then(unwrap);

// --- contacts ---
export const listContacts = (vendorId) => api.get(`/vendors/${vendorId}/contacts`).then(unwrap);
export const addContact = (vendorId, payload) => api.post(`/vendors/${vendorId}/contacts`, payload).then(unwrap);
export const deleteContact = (vendorId, contactId) => api.delete(`/vendors/${vendorId}/contacts/${contactId}`).then(unwrap);

// --- documents ---
export const listDocuments = (vendorId) => api.get(`/vendors/${vendorId}/documents`).then(unwrap);
export const addDocument = (vendorId, payload) => api.post(`/vendors/${vendorId}/documents`, payload).then(unwrap);
export const verifyDocument = (vendorId, documentId, verificationStatus) =>
  api.patch(`/vendors/${vendorId}/documents/${documentId}/verify`, { verificationStatus }).then(unwrap);

// --- bank accounts ---
export const listBankAccounts = (vendorId) => api.get(`/vendors/${vendorId}/bank-accounts`).then(unwrap);
export const addBankAccount = (vendorId, payload) => api.post(`/vendors/${vendorId}/bank-accounts`, payload).then(unwrap);
export const verifyBankAccount = (vendorId, bankAccountId) =>
  api.patch(`/vendors/${vendorId}/bank-accounts/${bankAccountId}/verify`).then(unwrap);

// --- contracts ---
export const listContracts = (vendorId) => api.get(`/vendors/${vendorId}/contracts`).then(unwrap);
export const addContract = (vendorId, payload) => api.post(`/vendors/${vendorId}/contracts`, payload).then(unwrap);
export const updateContractStatus = (vendorId, contractId, status) =>
  api.patch(`/vendors/${vendorId}/contracts/${contractId}/status`, { status }).then(unwrap);
