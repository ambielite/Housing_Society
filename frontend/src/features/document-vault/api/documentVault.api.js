import api from '../../../lib/axios';

const unwrap = (response) => response.data.data;
const clean = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
);

export const listFolders = (params = {}) => api.get('/document-vault/folders', { params: clean(params) }).then(unwrap);
export const getFolder = (id) => api.get(`/document-vault/folders/${id}`).then(unwrap);
export const createFolder = (payload) => api.post('/document-vault/folders', payload).then(unwrap);
export const updateFolder = (id, payload) => api.put(`/document-vault/folders/${id}`, payload).then(unwrap);
export const deleteFolder = (id) => api.delete(`/document-vault/folders/${id}`).then(unwrap);

export const listDocuments = (params = {}) => api.get('/document-vault/documents', { params: clean(params) }).then(unwrap);
export const getDocument = (id) => api.get(`/document-vault/documents/${id}`).then(unwrap);
export const uploadDocument = (payload) => {
  const body = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) body.append(key, value);
  });
  return api.post('/document-vault/documents', body, { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap);
};
export const updateDocument = (id, payload) => api.put(`/document-vault/documents/${id}`, payload).then(unwrap);
export const deleteDocument = (id) => api.delete(`/document-vault/documents/${id}`).then(unwrap);
export const downloadDocument = (id) => api.get(`/document-vault/documents/${id}/download`, { responseType: 'blob' });
export const listDownloadHistory = (id) => api.get(`/document-vault/documents/${id}/download-history`).then(unwrap);
export const listVersions = (id) => api.get(`/document-vault/documents/${id}/versions`).then(unwrap);
export const addVersion = (id, file, changeNote) => {
  const body = new FormData();
  body.append('file', file);
  if (changeNote) body.append('changeNote', changeNote);
  return api.post(`/document-vault/documents/${id}/versions`, body, { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap);
};

export const listPermissions = (documentId) => api.get(`/document-access/permissions/document/${documentId}`).then(unwrap);
export const grantPermission = (payload) => api.post('/document-access/permissions', payload).then(unwrap);
export const revokePermission = (id) => api.delete(`/document-access/permissions/${id}`).then(unwrap);
export const listDocumentLinks = (id) => api.get(`/document-access/links/document/${id}`).then(unwrap);
export const listEntityLinks = (entityType, entityId) => api.get('/document-access/links/entity', { params: { entityType, entityId } }).then(unwrap);
export const createDocumentLink = (payload) => api.post('/document-access/links', payload).then(unwrap);
export const deleteDocumentLink = (id) => api.delete(`/document-access/links/${id}`).then(unwrap);
