import api from '../../../lib/axios';

const unwrap = (response) => response.data.data;

const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined));

export const listRequests = (params) => api.get('/approvals', { params: clean(params) }).then(unwrap);
export const getRequest = (id) => api.get(`/approvals/${id}`).then(unwrap);
export const raiseApproval = (payload) => api.post('/approvals', payload).then(unwrap);
export const decide = (id, payload) => api.post(`/approvals/${id}/decide`, payload).then(unwrap);
export const cancel = (id) => api.post(`/approvals/${id}/cancel`).then(unwrap);
