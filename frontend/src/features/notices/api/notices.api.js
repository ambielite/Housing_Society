import { legacyApi } from '../../../lib/axios';

const noticesApi = {
  list: async (params) => (await legacyApi.get('/notices', { params })).data.data,
  get: async (id) => (await legacyApi.get(`/notices/${id}`)).data.data,
  create: async (body) => (await legacyApi.post('/notices', body)).data.data,
  update: async (id, body) => (await legacyApi.put(`/notices/${id}`, body)).data.data,
  markRead: async (id) => (await legacyApi.post(`/notices/${id}/read`)).data.data,
  expire: async (id) => (await legacyApi.post(`/notices/${id}/expire`)).data.data,
  renotify: async (id) => (await legacyApi.post(`/notices/${id}/renotify`)).data.data,
  saveTemplate: async (id) => (await legacyApi.post(`/notices/${id}/template`)).data.data,
  templates: async () => (await legacyApi.get('/notices/templates')).data.data,
  createFromTemplate: async (templateId, body) => (await legacyApi.post(`/notices/templates/${templateId}/notices`, body)).data.data,
};

export default noticesApi;
