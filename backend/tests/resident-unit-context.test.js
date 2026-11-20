jest.mock('../src/config/db', () => ({ query: jest.fn(), pool: { end: jest.fn().mockResolvedValue(undefined) } }));
jest.mock('../src/config/database', () => ({ close: jest.fn().mockResolvedValue(undefined) }));

const { query } = require('../src/config/db');
const {
  resolveResident,
  listEligibleUnits,
  resolveSingleUnit,
} = require('../src/modules/resident-context/residentUnitContext.service');

const user = { id: 'user-a', email: 'tenant@example.test', societyId: 'society-a' };

beforeEach(() => jest.clearAllMocks());

test('tenant Occupancy resolves its society-scoped Unit and duplicate relationship rows collapse', async () => {
  query.mockResolvedValueOnce({ rows: [{ id: 'resident-a' }] });
  query.mockResolvedValueOnce({ rows: [
    { unit_id: 'unit-a', unit_number: 'A-1', tower_name: 'Tower A' },
    { unit_id: 'unit-a', unit_number: 'A-1', tower_name: 'Tower A' },
  ] });

  const context = await resolveSingleUnit(user);

  expect(context.resident.id).toBe('resident-a');
  expect(context.unit.unit_id).toBe('unit-a');
  expect(query.mock.calls[1][0]).toContain("ou.status = 'ACTIVE'");
  expect(query.mock.calls[1][0]).toContain('ou.effective_from <= CURRENT_DATE');
  expect(query.mock.calls[1][0]).toContain("o.occupancy_type IN ('OWNER', 'TENANT')");
  expect(query.mock.calls[1][0]).toContain('o.is_current = true');
  expect(query.mock.calls[1][0]).toContain('o.start_date <= CURRENT_DATE');
  expect(query.mock.calls[1][0]).toContain('o.end_date >= CURRENT_DATE');
  expect(query.mock.calls[1][0]).toContain('t.society_id = $1');
  expect(query.mock.calls[1][1]).toEqual(['society-a', 'resident-a']);
});

test('valid OwnerUnit Unit is eligible and expired or future relationships are excluded by SQL dates', async () => {
  query.mockResolvedValueOnce({ rows: [{ unit_id: 'unit-owner', unit_number: 'B-2' }] });
  await expect(listEligibleUnits('society-a', 'resident-a'))
    .resolves.toEqual([{ unit_id: 'unit-owner', unit_number: 'B-2' }]);

  const sql = query.mock.calls[0][0];
  expect(sql).toContain('ou.effective_from <= CURRENT_DATE');
  expect(sql).toContain('ou.effective_to >= CURRENT_DATE');
  expect(sql).toContain('o.start_date <= CURRENT_DATE');
  expect(sql).toContain('o.end_date >= CURRENT_DATE');

  query.mockResolvedValueOnce({ rows: [] });
  await expect(listEligibleUnits('society-a', 'resident-a')).resolves.toEqual([]);
});

test('Unit relationship from another Society cannot resolve into this resident context', async () => {
  query.mockResolvedValueOnce({ rows: [{ id: 'resident-a' }] });
  query.mockResolvedValueOnce({ rows: [] });

  await expect(resolveSingleUnit(user)).rejects.toMatchObject({ statusCode: 403 });
  expect(query.mock.calls[1][1]).toEqual(['society-a', 'resident-a']);
  expect(query.mock.calls[1][0]).toContain('t.society_id = $1');
});

test('email fallback refuses to choose between multiple active Resident profiles', async () => {
  query.mockResolvedValueOnce({ rows: [] });
  query.mockResolvedValueOnce({ rows: [{ id: 'resident-a' }, { id: 'resident-b' }] });

  await expect(resolveResident(user)).rejects.toMatchObject({
    statusCode: 409,
    message: 'Multiple active Resident profiles match this account email',
  });
  expect(query.mock.calls[1][0]).toContain('user_id IS NULL');
  expect(query.mock.calls[1][1]).toEqual(['society-a', 'tenant@example.test']);
});

test('multiple direct Resident links are rejected instead of selecting an arbitrary row', async () => {
  query.mockResolvedValueOnce({ rows: [{ id: 'resident-a' }, { id: 'resident-b' }] });

  await expect(resolveResident(user)).rejects.toMatchObject({ statusCode: 409 });
  expect(query).toHaveBeenCalledTimes(1);
});

test('a resident linked by user ID takes precedence over unlinked email matches', async () => {
  query.mockResolvedValueOnce({ rows: [{ id: 'resident-linked' }] });

  await expect(resolveResident(user)).resolves.toEqual({ id: 'resident-linked' });
  expect(query).toHaveBeenCalledTimes(1);
});
