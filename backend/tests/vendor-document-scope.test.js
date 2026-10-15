jest.mock('../src/modules/document-folders/document-folders.repository', () => ({
  isDocumentLinkedToVendorScope: jest.fn(),
  findActivePermissionGrant: jest.fn(),
}));
jest.mock('../src/modules/document-folders/storage.helper', () => ({}));

const repository = require('../src/modules/document-folders/document-folders.repository');
const service = require('../src/modules/document-folders/document-folders.service');

describe('vendor document row-level access', () => {
  const document = { id: 'doc-a', sensitivity: 'INTERNAL', society_id: 'society-a', uploaded_by: 'admin' };
  const vendorUser = { id: 'user-a', roles: ['VENDOR'], vendorId: 'vendor-a', vendorIds: ['vendor-a'] };

  beforeEach(() => jest.clearAllMocks());

  test('denies a document that is not linked to the authenticated vendor scope', async () => {
    repository.isDocumentLinkedToVendorScope.mockResolvedValue(false);
    await expect(service.assertCanAccess(document, vendorUser)).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.isDocumentLinkedToVendorScope).toHaveBeenCalledWith('doc-a', ['vendor-a'], 'user-a');
  });

  test('allows a document linked to the authenticated vendor scope', async () => {
    repository.isDocumentLinkedToVendorScope.mockResolvedValue(true);
    await expect(service.assertCanAccess(document, vendorUser)).resolves.toBeUndefined();
  });

  test('does not let an unlinked vendor login access documents', async () => {
    repository.isDocumentLinkedToVendorScope.mockResolvedValue(false);
    await expect(service.assertCanAccess(document, { ...vendorUser, vendorId: null, vendorIds: [] })).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.isDocumentLinkedToVendorScope).toHaveBeenCalledWith('doc-a', [], 'user-a');
  });
});
