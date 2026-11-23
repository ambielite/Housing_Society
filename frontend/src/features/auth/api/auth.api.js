import api from '../../../lib/axios';

// Every backend response is { success, message, data } - return just `data`.
const unwrap = (response) => response.data.data;

export const login = (email, password) => api.post('/auth/login', { email, password, clientType: 'web' }).then(unwrap);
export const fetchProfile = () => api.get('/auth/me').then(unwrap);
export const logout = (refreshToken) => api.post('/auth/logout', { refreshToken }).then(unwrap);
export const logoutAll = () => api.post('/auth/logout-all').then(unwrap);
export const changePassword = ({ currentPassword, newPassword }) =>
  api.post('/auth/change-password', { currentPassword, newPassword }).then(unwrap);
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email }).then(unwrap);
export const resetPassword = ({ token, newPassword }) =>
  api.post('/auth/reset-password', { token, newPassword }).then(unwrap);
export const requestAdminPasswordResetOtp = (email) =>
  api.post('/auth/admin-forgot-password', { email }).then(unwrap);
export const resetAdminPasswordWithOtp = (payload) =>
  api.post('/auth/admin-reset-password', payload).then(unwrap);
// Self-signup creates a user with no roles. Not used by any screen yet.
export const register = (payload) => api.post('/auth/register', payload).then(unwrap);
