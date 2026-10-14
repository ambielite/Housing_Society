const express = require('express');
const controller = require('./rbac.controller');
const validate = require('../../common/validate');
const {
  createRoleSchema,
  updateRoleSchema,
  assignPermissionSchema,
  assignRoleToUserSchema,
} = require('./rbac.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/permissions', authorize('PERMISSION_READ'), controller.listPermissions);

router.get('/roles', authorize('ROLE_READ'), controller.listRoles);
router.post('/roles', authorize('ROLE_CREATE'), validate(createRoleSchema), controller.createRole);
router.put('/roles/:roleId', authorize('ROLE_UPDATE'), validate(updateRoleSchema), controller.updateRole);
router.delete('/roles/:roleId', authorize('ROLE_DELETE'), controller.deleteRole);

router.get('/roles/:roleId/permissions', authorize('ROLE_READ'), controller.getRolePermissions);
router.post(
  '/roles/:roleId/permissions',
  authorize('ROLE_PERMISSION_ASSIGN'),
  validate(assignPermissionSchema),
  controller.assignPermissionToRole
);
router.delete(
  '/roles/:roleId/permissions/:permissionCode',
  authorize('ROLE_PERMISSION_ASSIGN'),
  controller.removePermissionFromRole
);

router.post('/user-roles', authorize('USER_ROLE_ASSIGN'), validate(assignRoleToUserSchema), controller.assignRoleToUser);
router.delete('/user-roles/:userId/:roleCode', authorize('USER_ROLE_ASSIGN'), controller.removeRoleFromUser);
router.get('/user-roles/:userId', authorize('ROLE_READ'), controller.getUserRolesAndPermissions);

module.exports = router;
