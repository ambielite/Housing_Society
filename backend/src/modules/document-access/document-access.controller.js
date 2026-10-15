const service = require('./document-access.service');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');

// --- permissions ---
const grantPermission = asyncHandler(async (req, res) => {
  const permission = await service.grantPermission(req.body);
  return ApiResponse.success(res, permission, 'Permission granted successfully', 201);
});

const listPermissionsForDocument = asyncHandler(async (req, res) => {
  const permissions = await service.listPermissionsForDocument(req.params.documentId);
  return ApiResponse.success(res, permissions);
});

const revokePermission = asyncHandler(async (req, res) => {
  await service.revokePermission(req.params.permissionId);
  return ApiResponse.success(res, null, 'Permission revoked successfully');
});

// --- links ---
const createLink = asyncHandler(async (req, res) => {
  const link = await service.createLink(req.body);
  return ApiResponse.success(res, link, 'Document linked successfully', 201);
});

const listLinksForDocument = asyncHandler(async (req, res) => {
  const links = await service.listLinksForDocument(req.params.documentId);
  return ApiResponse.success(res, links);
});

const listLinksForEntity = asyncHandler(async (req, res) => {
  const links = await service.listLinksForEntity(req.query.entityType, req.query.entityId);
  return ApiResponse.success(res, links);
});

const deleteLink = asyncHandler(async (req, res) => {
  await service.deleteLink(req.params.linkId);
  return ApiResponse.success(res, null, 'Link removed successfully');
});

module.exports = {
  grantPermission,
  listPermissionsForDocument,
  revokePermission,
  createLink,
  listLinksForDocument,
  listLinksForEntity,
  deleteLink,
};
