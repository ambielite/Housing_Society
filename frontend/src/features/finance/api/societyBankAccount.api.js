import { legacyApi } from '../../../lib/axios';

const societyBankAccountApi = {
  getAll: async (societyId) => (await legacyApi.get('/society-bank-accounts', { params: { societyId } })).data,
  create: async (data) => (await legacyApi.post('/society-bank-accounts', data)).data,
  update: async (id, data) => (await legacyApi.put(`/society-bank-accounts/${id}`, data)).data,
  deactivate: async (id, societyId) => (await legacyApi.delete(`/society-bank-accounts/${id}`, { data: { societyId } })).data,
};

export default societyBankAccountApi;
