const service = require('./rbac.service');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');

const listPermissions = asyncHandler(async (req, res) => {
  const permissions = await service.listPermissions();
  return ApiResponse.success(res, permissions);
});

const listRoles = asyncHandler(async (req, res) => {
  const roles = await service.listRoles(req.user.societyId);
  return ApiResponse.success(res, roles);
});

const createRole = asyncHandler(async (req, res) => {
  const role = await service.createRole({
    ...req.body,
    societyId: req.body.societyId ?? req.user.societyId,
  });
  return ApiResponse.success(res, role, 'Role created successfully', 201);
});

const updateRole = asyncHandler(async (req, res) => {
  const role = await service.updateRole(req.params.roleId, req.body);
  return ApiResponse.success(res, role, 'Role updated successfully');
});

const deleteRole = asyncHandler(async (req, res) => {
  await service.deleteRole(req.params.roleId);
  return ApiResponse.success(res, null, 'Role deleted successfully');
});

const getRolePermissions = asyncHandler(async (req, res) => {
  const permissions = await service.getRolePermissions(req.params.roleId);
  return ApiResponse.success(res, permissions);
});

const assignPermissionToRole = asyncHandler(async (req, res) => {
  const permissions = await service.assignPermissionToRole(req.params.roleId, req.body.permissionCode);
  return ApiResponse.success(res, permissions, 'Permission assigned to role');
});

const removePermissionFromRole = asyncHandler(async (req, res) => {
  const permissions = await service.removePermissionFromRole(req.params.roleId, req.params.permissionCode);
  return ApiResponse.success(res, permissions, 'Permission removed from role');
});

const assignRoleToUser = asyncHandler(async (req, res) => {
  const roles = await service.assignRoleToUser({
    userId: req.body.userId,
    roleCode: req.body.roleCode,
    societyId: req.body.societyId ?? req.user.societyId,
    assignedBy: req.user.id,
  });
  return ApiResponse.success(res, roles, 'Role assigned to user');
});

const removeRoleFromUser = asyncHandler(async (req, res) => {
  const roles = await service.removeRoleFromUser({
    userId: req.params.userId,
    roleCode: req.params.roleCode,
    societyId: req.query.societyId ?? req.user.societyId,
  });
  return ApiResponse.success(res, roles, 'Role removed from user');
});

const getUserRolesAndPermissions = asyncHandler(async (req, res) => {
  const data = await service.getUserRolesAndPermissions(req.params.userId, req.user.societyId);
  return ApiResponse.success(res, data);
});

module.exports = {
  listPermissions,
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  assignPermissionToRole,
  removePermissionFromRole,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRolesAndPermissions,
};
