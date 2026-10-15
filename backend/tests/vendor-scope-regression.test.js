jest.mock('../src/modules/purchase-orders/purchase-orders.repository', () => ({
  findPOById: jest.fn(),
  listPOLines: jest.fn(),
  listPOs: jest.fn(),
}));
jest.mock('../src/modules/vendors/vendors.repository', () => ({
  findById: jest.fn(),
}));
jest.mock('../src/modules/document-folders/document-folders.repository', () => ({}));
jest.mock('../src/modules/users/users.repository', () => ({}));

const purchaseOrdersRepository = require('../src/modules/purchase-orders/purchase-orders.repository');
const vendorsRepository = require('../src/modules/vendors/vendors.repository');
const purchaseOrders = require('../src/modules/purchase-orders/purchase-orders.service');
const vendors = require('../src/modules/vendors/vendors.service');

describe('vendor row-level access with additional non-staff roles', () => {
  const vendorUser = {
    id: 'user-a',
    roles: ['VENDOR', 'RESIDENT'],
    vendorId: 'vendor-a',
    vendorIds: ['vendor-a'],
  };

  beforeEach(() => jest.clearAllMocks());

  test('does not expose another vendor purchase order by guessing its id', async () => {
    purchaseOrdersRepository.findPOById.mockResolvedValue({ id: 'po-b', vendor_id: 'vendor-b' });

    await expect(purchaseOrders.getPO('po-b', vendorUser)).rejects.toMatchObject({ statusCode: 403 });
    expect(purchaseOrdersRepository.listPOLines).not.toHaveBeenCalled();
  });

  test('does not expose another vendor record to a user with an additional non-staff role', async () => {
    vendorsRepository.findById.mockResolvedValue({ id: 'vendor-b', society_id: 'society-a' });

    await expect(vendors.getVendor('vendor-b', vendorUser)).rejects.toMatchObject({ statusCode: 403 });
  });
});
