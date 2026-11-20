jest.mock('../src/config/db', () => ({ query: jest.fn(), pool: { end: jest.fn().mockResolvedValue(undefined) } }));
jest.mock('../src/modules/helpdesk-setup/helpdesk-setup.repository', () => ({
  listCategories: jest.fn(), findCategoryById: jest.fn(),
}));
jest.mock('../src/modules/tickets/tickets.repository', () => ({ findById: jest.fn() }));
jest.mock('../src/modules/tickets/tickets.service', () => ({ createTicket: jest.fn() }));

const { query } = require('../src/config/db');
const helpdeskRepository = require('../src/modules/helpdesk-setup/helpdesk-setup.repository');
const ticketsService = require('../src/modules/tickets/tickets.service');
const complaintsService = require('../src/modules/resident-complaints/resident-complaints.service');

const user = { id: 'tenant-user', email: 'tenant@example.test', societyId: 'society-a' };
const payload = { categoryId: 'category-a', subject: 'Leak', description: 'Water leak' };

beforeEach(() => {
  jest.clearAllMocks();
  query.mockResolvedValueOnce({ rows: [{ id: 'tenant-resident' }] });
  query.mockResolvedValueOnce({ rows: [{ unit_id: 'tenant-unit' }] });
  helpdeskRepository.findCategoryById.mockResolvedValue({ id: 'category-a', society_id: 'society-a', status: 'ACTIVE' });
  ticketsService.createTicket.mockResolvedValue({ id: 'ticket-a' });
});

test('tenant complaint is bound to the effective Occupancy Unit and authenticated Resident', async () => {
  await complaintsService.createComplaint(user, payload);

  expect(ticketsService.createTicket).toHaveBeenCalledWith(expect.objectContaining({
    societyId: 'society-a', raisedBy: 'tenant-user', unitId: 'tenant-unit',
  }));
});

test('complaint creation rejects missing Unit context instead of submitting null Unit ID', async () => {
  query.mockReset();
  query.mockResolvedValueOnce({ rows: [{ id: 'tenant-resident' }] });
  query.mockResolvedValueOnce({ rows: [] });

  await expect(complaintsService.createComplaint(user, payload)).rejects.toMatchObject({ statusCode: 403 });
  expect(helpdeskRepository.findCategoryById).not.toHaveBeenCalled();
  expect(ticketsService.createTicket).not.toHaveBeenCalled();
});

test('Resident profile lookup remains Society-scoped for complaints', async () => {
  await complaintsService.createComplaint(user, payload);

  expect(query.mock.calls[0][0]).toContain('society_id = $1');
  expect(query.mock.calls[0][1]).toEqual(['society-a', 'tenant-user']);
});
