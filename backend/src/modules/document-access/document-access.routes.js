const express = require('express');
const controller = require('./document-access.controller');
const validate = require('../../common/validate');
const {
  grantPermissionSchema,
  createLinkSchema,
  listLinksForEntityQuerySchema,
} = require('./document-access.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();

router.use(authenticate);

// Permissions
router.post('/permissions', authorize('DOCUMENT_PERMISSION_MANAGE'), validate(grantPermissionSchema), controller.grantPermission);
router.get(
  '/permissions/document/:documentId',
  authorize('DOCUMENT_PERMISSION_READ'),
  controller.listPermissionsForDocument
);
router.delete('/permissions/:permissionId', authorize('DOCUMENT_PERMISSION_MANAGE'), controller.revokePermission);

// Links
router.post('/links', authorize('DOCUMENT_LINK_CREATE'), validate(createLinkSchema), controller.createLink);
router.get('/links/document/:documentId', authorize('DOCUMENT_LINK_READ'), controller.listLinksForDocument);
router.get(
  '/links/entity',
  authorize('DOCUMENT_LINK_READ'),
  validate(listLinksForEntityQuerySchema, 'query'),
  controller.listLinksForEntity
);
router.delete('/links/:linkId', authorize('DOCUMENT_LINK_CREATE'), controller.deleteLink);

module.exports = router;
