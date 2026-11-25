const express = require('express');
const multer = require('multer');
const { authenticate, authorize } = require('../../common/authMiddleware');
const asyncHandler = require('../../common/asyncHandler');
const ApiError = require('../../common/ApiError');
const ApiResponse = require('../../common/ApiResponse');
const service = require('./advertisements.service');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
      return callback(new ApiError(400, 'Choose a JPG, PNG, WEBP, or GIF image'));
    }
    callback(null, true);
  },
});
const parseUpload = (req, res, next) => upload.single('image')(req, res, (error) => {
  if (!error) return next();
  return next(error instanceof multer.MulterError ? new ApiError(400, error.message) : error);
});
const residentOnly = (req, res, next) => {
  if (!req.user.roles.some((role) => ['RESIDENT_APP', 'RESIDENT'].includes(role))) {
    return res.status(403).json({ success: false, message: 'Resident access is required' });
  }
  return next();
};

router.use(authenticate);
router.get('/admin', authorize('ADVERTISEMENT_READ'), asyncHandler(async (req, res) =>
  ApiResponse.success(res, await service.listForAdmin(req.user.societyId), 'Advertisements loaded')));
router.post('/admin', authorize('ADVERTISEMENT_CREATE'), parseUpload, asyncHandler(async (req, res) =>
  ApiResponse.success(res, await service.create(req.user, req.body, req.file), 'Advertisement created', 201)));
router.put('/admin/:id', authorize('ADVERTISEMENT_UPDATE'), parseUpload, asyncHandler(async (req, res) =>
  ApiResponse.success(res, await service.update(req.user, req.params.id, req.body, req.file), 'Advertisement updated')));
router.patch('/admin/:id/active', authorize('ADVERTISEMENT_UPDATE'), asyncHandler(async (req, res) =>
  ApiResponse.success(res, await service.setActive(req.user, req.params.id, req.body.isActive === true || req.body.isActive === 'true'), 'Advertisement status updated')));
router.delete('/admin/:id', authorize('ADVERTISEMENT_DELETE'), asyncHandler(async (req, res) =>
  ApiResponse.success(res, await service.remove(req.user, req.params.id), 'Advertisement deleted')));
router.get('/resident', residentOnly, asyncHandler(async (req, res) =>
  ApiResponse.success(res, await service.listForResident(req.user), 'Advertisements loaded')));
router.post('/resident/:id/impression', residentOnly, asyncHandler(async (req, res) =>
  ApiResponse.success(res, await service.recordImpression(req.user, req.params.id), 'Advertisement view recorded')));
router.post('/resident/:id/dismiss', residentOnly, asyncHandler(async (req, res) =>
  ApiResponse.success(res, await service.dismiss(req.user, req.params.id), 'Advertisement dismissed')));

module.exports = router;
