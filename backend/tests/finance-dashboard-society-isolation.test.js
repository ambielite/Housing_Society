const societyA = '11111111-1111-4111-8111-111111111111';

const scopedList = async (model, invoke) => {
  const rows = [{ id: 'a', societyId: societyA }];
  const findAll = jest.spyOn(model, 'findAll').mockResolvedValue(rows);
  await expect(invoke()).resolves.toEqual(rows);
  expect(findAll).toHaveBeenCalledWith(expect.objectContaining({ where: { societyId: societyA } }));
  findAll.mockRestore();
};

test('accounts and accounting periods repositories scope list queries to Society A', async () => {
  const Account = require('../src/modules/financial/account/account.model');
  const accounts = require('../src/modules/financial/account/account.repository');
  const AccountingPeriod = require('../src/modules/financial/accounting-period/accountingPeriod.model');
  const periods = require('../src/modules/financial/accounting-period/accountingPeriod.repository');
  await scopedList(Account, () => accounts.findAll(societyA));
  await scopedList(AccountingPeriod, () => periods.findAll(societyA));
});

test('journals and payments repositories scope list queries to Society A', async () => {
  const Journal = require('../src/modules/financial/journal/journal.model');
  const journals = require('../src/modules/financial/journal/journal.repository');
  const Payment = require('../src/modules/financial/payment/payment.model');
  const payments = require('../src/modules/financial/payment/payment.repository');
  await scopedList(Journal, () => journals.findAll(societyA));
  await scopedList(Payment, () => payments.findAll({ societyId: societyA }));
});

test('Other Income list stays scoped to Society A', async () => {
  const OtherIncome = require('../src/modules/financial/other-income/otherIncome.model');
  const service = require('../src/modules/financial/other-income/otherIncome.service');
  await scopedList(OtherIncome, () => service.list(societyA));
});

test('authenticated cross-Society list requests are rejected while authorized Super Admin Society access is retained', async () => {
  const usersRepository = require('../src/modules/users/users.repository');
  const rbacRepository = require('../src/modules/rbac/rbac.repository');
  const jwt = require('jsonwebtoken');
  const { authenticate } = require('../src/common/authMiddleware');
  const userId = '22222222-2222-4222-8222-222222222222';
  jest.spyOn(jwt, 'verify').mockReturnValue({ sub: userId });
  jest.spyOn(usersRepository, 'findById').mockResolvedValue({ id: userId, email: 'admin@example.test', status: 'ACTIVE', society_id: null });
  jest.spyOn(usersRepository, 'hasSocietyAccess').mockImplementation(async (_id, requested) => requested === societyA);
  jest.spyOn(usersRepository, 'listAccessibleSocieties').mockResolvedValue([{ id: societyA }]);
  jest.spyOn(rbacRepository, 'getUserRoles').mockResolvedValue([{ code: 'SUPER_ADMIN' }]);
  jest.spyOn(rbacRepository, 'getUserPermissions').mockResolvedValue([]);

  const run = (requestedSociety) => new Promise((resolve, reject) => {
    const req = { headers: { authorization: 'Bearer test', 'x-society-id': requestedSociety }, query: {}, params: {}, body: {}, method: 'GET' };
    authenticate(req, {}, (error) => error ? reject(error) : resolve(req));
  });
  await expect(run('33333333-3333-4333-8333-333333333333')).rejects.toMatchObject({ statusCode: 403 });
  await expect(run(societyA)).resolves.toMatchObject({ user: { societyId: societyA, roles: ['SUPER_ADMIN'] } });
  jest.restoreAllMocks();
});
