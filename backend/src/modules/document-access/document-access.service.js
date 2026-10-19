const ApiError = require('../../common/ApiError');
const repository = require('./document-access.repository');
const documentFoldersRepository = require('../document-folders/document-folders.repository');
const db = require('../../config/db');

// --- permissions --------------------------------------------------------------

const grantPermission = async ({ documentId, roleId, userId, permissionType, expiresAt }) => {
  const document = await documentFoldersRepository.findDocumentById(documentId);
  if (!document) {
    throw new ApiError(404, 'Document not found');
  }
  if (!roleId && !userId) {
    throw new ApiError(400, 'Provide at least one of roleId or userId');
  }
  return repository.grantPermission({ documentId, roleId, userId, permissionType, expiresAt });
};

const listPermissionsForDocument = async (documentId) => {
  const document = await documentFoldersRepository.findDocumentById(documentId);
  if (!document) {
    throw new ApiError(404, 'Document not found');
  }
  return repository.listPermissionsForDocument(documentId);
};

const revokePermission = async (id) => {
  const permission = await repository.findPermissionById(id);
  if (!permission) {
    throw new ApiError(404, 'Permission grant not found');
  }
  return repository.revokePermission(id);
};

// --- links --------------------------------------------------------------------------

const createLink = async ({ documentId, entityType, entityId, linkType }) => {
  const document = await documentFoldersRepository.findDocumentById(documentId);
  if (!document) {
    throw new ApiError(404, 'Document not found');
  }
  if (entityType !== 'OTHER') {
    const entityQueries = {
      VENDOR_CONTRACT: `SELECT v.society_id FROM vendor_contracts vc JOIN vendors v ON v.id = vc.vendor_id WHERE vc.id = $1`,
      TICKET: 'SELECT society_id FROM tickets WHERE id = $1',
      PURCHASE_ORDER: 'SELECT society_id FROM purchase_orders WHERE id = $1',
      VISITOR_PROFILE: 'SELECT society_id FROM visitor_profiles WHERE id = $1',
    };
    const query = entityQueries[entityType];
    const result = query ? await db.query(query, [entityId]) : { rows: [] };
    if (!result.rows[0]) throw new ApiError(404, 'The selected linked record was not found');
    if (result.rows[0].society_id !== document.society_id) {
      throw new ApiError(400, 'The linked record belongs to a different society than the document');
    }
  }
  return repository.createLink({ documentId, entityType, entityId, linkType });
};

const listLinksForDocument = async (documentId) => {
  const document = await documentFoldersRepository.findDocumentById(documentId);
  if (!document) {
    throw new ApiError(404, 'Document not found');
  }
  return repository.listLinksForDocument(documentId);
};

const listLinksForEntity = (entityType, entityId) => repository.listLinksForEntity(entityType, entityId);

const deleteLink = async (id) => {
  const link = await repository.findLinkById(id);
  if (!link) {
    throw new ApiError(404, 'Link not found');
  }
  return repository.deleteLink(id);
};

module.exports = {
  grantPermission,
  listPermissionsForDocument,
  revokePermission,
  createLink,
  listLinksForDocument,
  listLinksForEntity,
  deleteLink,
};
