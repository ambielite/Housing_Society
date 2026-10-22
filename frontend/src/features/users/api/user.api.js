import api from '../../../lib/axios';

const unwrap = (response) => response.data.data;

// The backend rejects empty-string filters, so drop anything blank before sending.
const clean = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));

export const listUsers = (params) => api.get('/users', { params: clean(params) }).then(unwrap);
export const getUser = (id) => api.get(`/users/${id}`).then(unwrap);
export const createUser = (payload) => {
  if (!payload.profilePicture) {
    return api.post('/users', payload).then(unwrap);
  }

  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key !== 'profilePicture' && value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  formData.append('profilePicture', payload.profilePicture);
  return api.post('/users', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(unwrap);
};
export const updateUser = (id, payload) => {
  if (!payload.profilePicture) {
    return api.patch(`/users/${id}`, payload).then(unwrap);
  }

  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key !== 'profilePicture' && value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  formData.append('profilePicture', payload.profilePicture);
  return api.patch(`/users/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(unwrap);
};
export const updateStatus = (id, status) => api.patch(`/users/${id}/status`, { status }).then(unwrap);
export const archiveUser = (id) => api.delete(`/users/${id}`).then(unwrap);
export const forceLogout = (id) => api.post(`/users/${id}/force-logout`).then(unwrap);
export const getLoginHistory = (id) => api.get(`/users/${id}/login-history`).then(unwrap);
