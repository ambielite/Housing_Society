jest.mock('../src/config/db', () => ({ query: jest.fn(), pool: { end: jest.fn().mockResolvedValue(undefined) } }));
jest.mock('../src/modules/notices/notices.service', () => ({ list: jest.fn() }));

const { query } = require('../src/config/db');
const noticesService = require('../src/modules/notices/notices.service');
const dashboardService = require('../src/modules/resident-dashboard/resident-dashboard.service');

test('dashboard propagates ambiguous authenticated Resident match instead of selecting one', async () => {
  query.mockResolvedValueOnce({ rows: [{ society_id: 'society-a' }] });
  query.mockResolvedValueOnce({ rows: [{ id: 'resident-a' }, { id: 'resident-b' }] });

  await expect(dashboardService.getDashboard({
    id: 'user-a', email: 'duplicate@example.test', societyId: 'society-a',
  })).rejects.toMatchObject({ statusCode: 409 });

  expect(query).toHaveBeenCalledTimes(2);
  expect(noticesService.list).not.toHaveBeenCalled();
});
