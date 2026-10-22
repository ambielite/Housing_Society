const express = require('express');
const multer = require('multer');
const path = require('path');
const controller = require('./users.controller');
const validate = require('../../common/validate');
const ApiError = require('../../common/ApiError');
const {
  createUserSchema,
  updateProfileSchema,
  updateStatusSchema,
  listUsersQuerySchema,
} = require('./users.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();
const allowedProfileImages = new Map([
  ['image/jpeg', new Set(['.jpg', '.jpeg'])],
  ['image/png', new Set(['.png'])],
  ['image/webp', new Set(['.webp'])],
]);
const profilePictureUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const extensions = allowedProfileImages.get(file.mimetype);
    const extension = path.extname(file.originalname).toLowerCase();
    if (!extensions?.has(extension)) {
      return callback(new ApiError(400, 'Profile picture must be a JPG, PNG, or WEBP image'));
    }
    callback(null, true);
  },
});
const parseProfilePicture = (req, res, next) => {
  profilePictureUpload.single('profilePicture')(req, res, (error) => {
    if (error instanceof multer.MulterError) return next(new ApiError(400, error.message));
    if (req.file) req.body.profilePicture = true;
    next(error);
  });
};

// Every route below requires a valid access token.
router.use(authenticate);

router.get('/', authorize('USER_READ'), validate(listUsersQuerySchema, 'query'), controller.listUsers);
router.post('/', authorize('USER_CREATE'), parseProfilePicture, validate(createUserSchema), controller.createUser);

router.get('/me/societies', controller.listMySocieties);

router.get('/:userId', authorize('USER_READ'), controller.getUser);
router.patch('/:userId', authorize('USER_UPDATE'), parseProfilePicture, validate(updateProfileSchema), controller.updateProfile);
router.patch('/:userId/status', authorize('USER_UPDATE'), validate(updateStatusSchema), controller.updateStatus);
router.delete('/:userId', authorize('USER_DELETE'), controller.archiveUser);

router.post('/:userId/force-logout', authorize('USER_FORCE_LOGOUT'), controller.forceLogout);
router.get('/:userId/login-history', authorize('USER_READ'), controller.getLoginHistory);

module.exports = router;
