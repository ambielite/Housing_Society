jest.mock('../src/modules/purchase-orders/purchase-orders.repository', () => ({
  findPOById: jest.fn(), listPOLines: jest.fn(), findInvoiceById: jest.fn(),
  listInvoiceLines: jest.fn(), listPaymentsForInvoice: jest.fn(),
}));
jest.mock('../src/modules/vendors/vendors.repository', () => ({ findById: jest.fn() }));
jest.mock('../src/modules/document-folders/document-folders.repository', () => ({}));
jest.mock('../src/modules/tickets/tickets.repository', () => ({ findById: jest.fn(), findActiveAssignment: jest.fn() }));
jest.mock('../src/modules/helpdesk-setup/helpdesk-setup.repository', () => ({}));
jest.mock('../src/modules/sla/sla.service', () => ({ refreshTicketSla: jest.fn() }));

const ordersRepository = require('../src/modules/purchase-orders/purchase-orders.repository');
const vendorsRepository = require('../src/modules/vendors/vendors.repository');
const ticketsRepository = require('../src/modules/tickets/tickets.repository');
const orders = require('../src/modules/purchase-orders/purchase-orders.service');
const tickets = require('../src/modules/tickets/tickets.service');
const { isVendorScoped } = require('../src/common/vendorScope');

describe('vendor access cannot be widened by guessing related record IDs', () => {
  const vendorAUser = { id: 'user-a', roles: ['VENDOR', 'RESIDENT'], vendorId: 'vendor-a', vendorIds: ['vendor-a'] };

  beforeEach(() => jest.clearAllMocks());

  test('a mixed-role vendor cannot read another vendor purchase order', async () => {
    ordersRepository.findPOById.mockResolvedValue({ id: 'po-b', vendor_id: 'vendor-b' });
    await expect(orders.getPO('po-b', vendorAUser)).rejects.toMatchObject({ statusCode: 403 });
    expect(ordersRepository.listPOLines).not.toHaveBeenCalled();
  });

  test('a mixed-role vendor cannot read another vendor invoice', async () => {
    ordersRepository.findInvoiceById.mockResolvedValue({ id: 'invoice-b', vendor_id: 'vendor-b' });
    await expect(orders.getInvoice('invoice-b', vendorAUser)).rejects.toMatchObject({ statusCode: 404 });
    expect(ordersRepository.listInvoiceLines).not.toHaveBeenCalled();
  });

  test('a mixed-role vendor cannot read a ticket assigned to another vendor', async () => {
    ticketsRepository.findById.mockResolvedValue({ id: 'ticket-b', society_id: 'society-a' });
    ticketsRepository.findActiveAssignment.mockResolvedValue({ assigned_vendor_id: 'vendor-b' });
    vendorsRepository.findById.mockResolvedValue({ id: 'vendor-a', society_id: 'society-a' });
    expect(isVendorScoped(vendorAUser)).toBe(true);
    await expect(tickets.getTicket('ticket-b', { restricted: true, vendorId: 'vendor-a' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});
