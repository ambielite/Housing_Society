import api from '../../../lib/axios';

const unwrap = (response) => response.data.data;

// --- permission catalog ---
export const listPermissions = () => api.get('/rbac/permissions').then(unwrap);

// --- roles ---
export const listRoles = () => api.get('/rbac/roles').then(unwrap);
export const createRole = (payload) => api.post('/rbac/roles', payload).then(unwrap);
export const updateRole = (id, payload) => api.put(`/rbac/roles/${id}`, payload).then(unwrap);
export const deleteRole = (id) => api.delete(`/rbac/roles/${id}`).then(unwrap);

// --- permissions on a role (both mutations return the role's full, updated permission list) ---
export const getRolePermissions = (id) => api.get(`/rbac/roles/${id}/permissions`).then(unwrap);
export const assignPermission = (id, permissionCode) =>
  api.post(`/rbac/roles/${id}/permissions`, { permissionCode }).then(unwrap);
export const removePermission = (id, permissionCode) =>
  api.delete(`/rbac/roles/${id}/permissions/${permissionCode}`).then(unwrap);

// --- roles on a user (societyId is optional; the backend defaults to the caller's society) ---
// skipSociety: don't send the "picked society" header here. The role must be saved for the
// user's own society (or for no society if the user has none), otherwise it won't show up
// or take effect for that user.
export const assignRoleToUser = ({ userId, roleCode, societyId }) =>
  api
    .post('/rbac/user-roles', { userId, roleCode, ...(societyId ? { societyId } : {}) }, { skipSociety: true })
    .then(unwrap);
export const removeRoleFromUser = (userId, roleCode, societyId) =>
  api
    .delete(`/rbac/user-roles/${userId}/${roleCode}`, { params: societyId ? { societyId } : undefined, skipSociety: true })
    .then(unwrap);