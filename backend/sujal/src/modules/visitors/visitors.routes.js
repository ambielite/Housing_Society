const express = require('express');
const controller = require('./visitors.controller');
const validate = require('../../common/validate');
const {
  createProfileSchema,
  listProfilesQuerySchema,
  updateProfileSchema,
  setBlacklistStatusSchema,
  createInviteSchema,
  listInvitesQuerySchema,
  decideInviteSchema,
  createPassSchema,
  listPassesQuerySchema,
  recordEventSchema,
  listGateEventsQuerySchema,
  triggerOverstaySchema,
  listOverstayAlertsQuerySchema,
  acknowledgeOverstaySchema,
} = require('./visitors.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();

router.use(authenticate);

// Visitor profiles
router.post('/profiles', authorize('VISITOR_PROFILE_CREATE'), validate(createProfileSchema), controller.createProfile);
router.get(
  '/profiles',
  authorize('VISITOR_PROFILE_READ'),
  validate(listProfilesQuerySchema, 'query'),
  controller.listProfiles
);
router.get('/profiles/:profileId', authorize('VISITOR_PROFILE_READ'), controller.getProfile);
router.patch(
  '/profiles/:profileId',
  authorize('VISITOR_PROFILE_UPDATE'),
  validate(updateProfileSchema),
  controller.updateProfile
);
router.patch(
  '/profiles/:profileId/blacklist',
  authorize('VISITOR_PROFILE_UPDATE'),
  validate(setBlacklistStatusSchema),
  controller.setBlacklistStatus
);

// Visitor invites (pre-approval)
router.post('/invites', authorize('VISITOR_INVITE_CREATE'), validate(createInviteSchema), controller.createInvite);
router.get('/invites', authorize('VISITOR_INVITE_READ'), validate(listInvitesQuerySchema, 'query'), controller.listInvites);
router.get('/invites/:inviteId', authorize('VISITOR_INVITE_READ'), controller.getInvite);
router.patch(
  '/invites/:inviteId/decide',
  authorize('VISITOR_INVITE_UPDATE'),
  validate(decideInviteSchema),
  controller.decideInvite
);

// Visitor passes (gate-facing lifecycle)
router.post('/passes', authorize('VISITOR_PASS_CREATE'), validate(createPassSchema), controller.createPass);
router.get('/passes', authorize('VISITOR_PASS_READ'), validate(listPassesQuerySchema, 'query'), controller.listPasses);
router.get('/passes/:passId', authorize('VISITOR_PASS_READ'), controller.getPass);
router.patch('/passes/:passId/arrival', authorize('VISITOR_PASS_UPDATE'), controller.recordArrival);
router.patch('/passes/:passId/entry', authorize('VISITOR_PASS_UPDATE'), validate(recordEventSchema), controller.recordEntry);
router.patch('/passes/:passId/exit', authorize('VISITOR_PASS_UPDATE'), validate(recordEventSchema), controller.recordExit);
router.patch('/passes/:passId/cancel', authorize('VISITOR_PASS_UPDATE'), controller.cancelPass);
router.post(
  '/passes/:passId/overstay',
  authorize('VISITOR_PASS_UPDATE'),
  validate(triggerOverstaySchema),
  controller.triggerOverstay
);

// Gate events (read-only audit trail)
router.get('/gate-events', authorize('GATE_EVENT_READ'), validate(listGateEventsQuerySchema, 'query'), controller.listGateEvents);

// Overstay alerts
router.get(
  '/overstay-alerts',
  authorize('OVERSTAY_ALERT_READ'),
  validate(listOverstayAlertsQuerySchema, 'query'),
  controller.listOverstayAlerts
);
router.patch(
  '/overstay-alerts/:alertId',
  authorize('OVERSTAY_ALERT_UPDATE'),
  validate(acknowledgeOverstaySchema),
  controller.acknowledgeOverstayAlert
);

module.exports = router;
