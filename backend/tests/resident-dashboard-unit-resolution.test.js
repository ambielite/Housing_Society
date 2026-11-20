jest.mock('../src/config/db', () => ({ query: jest.fn(), pool: { end: jest.fn().mockResolvedValue(undefined) } }));
jest.mock('../src/modules/notices/notices.service', () => ({ list: jest.fn(), processSchedule: jest.fn() }));
jest.mock('../src/modules/resident-context/residentUnitContext.service', () => ({ resolveResidentUnits: jest.fn() }));

const { query } = require('../src/config/db');
const noticesService = require('../src/modules/notices/notices.service');
const residentContext = require('../src/modules/resident-context/residentUnitContext.service');
const dashboardService = require('../src/modules/resident-dashboard/resident-dashboard.service');

const user = { id: 'user-a', email: 'tenant@example.test', societyId: 'society-a' };

beforeEach(() => {
  jest.clearAllMocks();
  query.mockResolvedValue({ rows: [{ society_id: 'society-a', society_name: 'Society A', currency: 'INR' }] });
  noticesService.list.mockResolvedValue({ rows: [], total: 0, limit: 100 });
  residentContext.resolveResidentUnits.mockResolvedValue({
    resident: { id: 'resident-a', display_name: 'Tenant A', profile_photo: null },
    units: [
      { unit_id: 'unit-tenant', unit_number: 'T-1', tower_name: 'Tower T', floor_name: 'Floor 1' },
      { unit_id: 'unit-owner', unit_number: 'O-2', tower_name: 'Tower O', floor_name: 'Floor 2' },
    ],
  });
});

test('dashboard preserves its single-Unit response and uses deterministic resolver priority', async () => {
  const result = await dashboardService.getDashboard(user);

  expect(residentContext.resolveResidentUnits).toHaveBeenCalledWith(user);
  expect(result.unit).toEqual({ number: 'T-1', tower: 'Tower T', floor: 'Floor 1' });
  expect(result.resident.name).toBe('Tenant A');
  expect(query).toHaveBeenCalledWith(expect.stringContaining('FROM invoices i'), ['unit-tenant', 'society-a']);
});

test('dashboard does not choose a Unit when no eligible resident relationship exists', async () => {
  residentContext.resolveResidentUnits.mockResolvedValue({ resident: { id: 'resident-a' }, units: [] });

  const result = await dashboardService.getDashboard(user);

  expect(result.unit).toBeNull();
  expect(query.mock.calls.some(([, params]) => Array.isArray(params) && params[0] === null)).toBe(true);
});
