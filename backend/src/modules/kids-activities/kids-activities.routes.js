const express = require('express');
const { authenticate, authorize } = require('../../common/authMiddleware');
const asyncHandler = require('../../common/asyncHandler');
const ApiResponse = require('../../common/ApiResponse');
const service = require('./kids-activities.service');

const router = express.Router();
router.use(authenticate);

router.get('/activities', authorize('COMMUNITY_EVENT_READ'), asyncHandler(async (req, res) =>
  ApiResponse.success(res, await service.listForAdmin(req.user.societyId), 'Kids activities loaded')));
router.post('/activities', authorize('COMMUNITY_EVENT_CREATE'), asyncHandler(async (req, res) =>
  ApiResponse.success(res, await service.create(req.user, req.body), 'Kids activity created', 201)));
router.put('/activities/:id', authorize('COMMUNITY_EVENT_UPDATE'), asyncHandler(async (req, res) =>
  ApiResponse.success(res, await service.update(req.user, req.params.id, req.body), 'Kids activity updated')));
router.delete('/activities/:id', authorize('COMMUNITY_EVENT_DELETE'), asyncHandler(async (req, res) =>
  ApiResponse.success(res, await service.remove(req.user.societyId, req.params.id), 'Kids activity deleted')));
router.get('/activities/:id/registrations', authorize('COMMUNITY_EVENT_READ'), asyncHandler(async (req, res) =>
  ApiResponse.success(res, await service.listRegistrations(req.user.societyId, req.params.id), 'Activity registrations loaded')));
router.get('/resident', asyncHandler(async (req, res) => {
  if (!req.user.roles.some((role) => ['RESIDENT_APP', 'RESIDENT'].includes(role))) return res.status(403).json({ success: false, message: 'Resident access is required' });
  return ApiResponse.success(res, await service.listResident(req.user), 'Kids activities loaded');
}));
router.post('/resident/:activityId/register', asyncHandler(async (req, res) => {
  if (!req.user.roles.some((role) => ['RESIDENT_APP', 'RESIDENT'].includes(role))) return res.status(403).json({ success: false, message: 'Resident access is required' });
  return ApiResponse.success(res, await service.register(req.user, req.params.activityId, req.body.children), 'Children registered successfully');
}));

module.exports = router;
