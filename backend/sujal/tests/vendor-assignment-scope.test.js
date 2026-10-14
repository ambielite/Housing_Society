jest.mock('../src/modules/tickets/tickets.repository', () => ({
  findById: jest.fn(),
  findActiveAssignment: jest.fn(),
  unassign: jest.fn(),
  createAssignment: jest.fn(),
  updateStatus: jest.fn(),
  addStatusHistory: jest.fn(),
}));
jest.mock('../src/modules/vendors/vendors.repository', () => ({
  findById: jest.fn(),
  findByUserId: jest.fn(),
}));
jest.mock('../src/modules/users/users.repository', () => ({ findById: jest.fn() }));
jest.mock('../src/modules/helpdesk-setup/helpdesk-setup.repository', () => ({}));
jest.mock('../src/modules/sla/sla.service', () => ({}));

const repository = require('../src/modules/tickets/tickets.repository');
const vendorsRepository = require('../src/modules/vendors/vendors.repository');
const usersRepository = require('../src/modules/users/users.repository');
const service = require('../src/modules/tickets/tickets.service');

describe('vendor boundary on ticket assignments', () => {
  const ticketId = 'ticket-a';
  const vendorA = { id: 'vendor-a', society_id: 'society-a' };
  const vendorB = { id: 'vendor-b', society_id: 'society-a' };
  const current = { id: 'assignment-current', ticket_id: ticketId, assigned_vendor_id: 'vendor-a', unassigned_at: null };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findById.mockResolvedValue({ id: ticketId, society_id: 'society-a', status: 'ASSIGNED' });
    repository.findActiveAssignment.mockResolvedValue(current);
    vendorsRepository.findById.mockImplementation(async (id) => id === vendorA.id ? vendorA : id === vendorB.id ? vendorB : null);
    usersRepository.findById.mockResolvedValue({ id: 'user-a', society_id: 'society-a' });
    repository.createAssignment.mockImplementation(async (assignment) => assignment);
  });

  test('rejects assigning Vendor A work to a Vendor B user', async () => {
    vendorsRepository.findByUserId.mockResolvedValue(vendorB);
    await expect(service.assignTicket(ticketId, { assignedToUserId: 'user-b' })).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.unassign).not.toHaveBeenCalled();
    expect(repository.createAssignment).not.toHaveBeenCalled();
  });

  test('allows assigning Vendor A work to a user linked to Vendor A', async () => {
    vendorsRepository.findByUserId.mockResolvedValue(vendorA);
    repository.createAssignment.mockImplementation(async ({ ticketId: id, assignedToUserId, assignedVendorId }) => ({ id: 'new-assignment', ticket_id: id, assigned_to_user_id: assignedToUserId, assigned_vendor_id: assignedVendorId }));
    const result = await service.assignTicket(ticketId, { assignedToUserId: 'user-a' });
    expect(repository.createAssignment).toHaveBeenCalledWith({ ticketId, assignedToUserId: 'user-a', assignedVendorId: 'vendor-a' });
    expect(result.assigned_vendor_id).toBe('vendor-a');
  });
});
