const ApiError = require('../../common/ApiError');
const repository = require('./document-access.repository');
const documentFoldersRepository = require('../document-folders/document-folders.repository');

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
