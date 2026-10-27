import { legacyApi } from '../../../lib/axios';

const otherIncomeApi = {
  list: async (societyId) => (await legacyApi.get('/other-incomes', { params: { societyId } })).data,
  create: async (data) => (await legacyApi.post('/other-incomes', data)).data,
};

export default otherIncomeApi;
