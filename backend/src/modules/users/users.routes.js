const express = require('express');
const controller = require('./users.controller');
const validate = require('../../common/validate');
const {
  createUserSchema,
  updateProfileSchema,
  updateStatusSchema,
  listUsersQuerySchema,
} = require('./users.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();

// Every route below requires a valid access token.
router.use(authenticate);

router.get('/', authorize('USER_READ'), validate(listUsersQuerySchema, 'query'), controller.listUsers);
router.post('/', authorize('USER_CREATE'), validate(createUserSchema), controller.createUser);

router.get('/me/societies', controller.listMySocieties);

router.get('/:userId', authorize('USER_READ'), controller.getUser);
router.patch('/:userId', authorize('USER_UPDATE'), validate(updateProfileSchema), controller.updateProfile);
router.patch('/:userId/status', authorize('USER_UPDATE'), validate(updateStatusSchema), controller.updateStatus);
router.delete('/:userId', authorize('USER_DELETE'), controller.archiveUser);

router.post('/:userId/force-logout', authorize('USER_FORCE_LOGOUT'), controller.forceLogout);
router.get('/:userId/login-history', authorize('USER_READ'), controller.getLoginHistory);

module.exports = router;
