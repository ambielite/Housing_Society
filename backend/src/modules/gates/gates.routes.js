const express = require('express');
const controller = require('./gates.controller');
const validate = require('../../common/validate');
const {
  createGateSchema,
  updateGateSchema,
  createGuardSchema,
  listGuardsQuerySchema,
  updateGuardSchema,
  issueAccessCardSchema,
  listAccessCardsQuerySchema,
  createGateDeviceSchema,
  updateGateDeviceSchema,
  ingestDeviceEventSchema,
} = require('./gates.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();

router.use(authenticate);

// IMPORTANT: these static-prefixed routes (/guards, /access-cards,
// /devices) must be declared BEFORE the "/:gateId" routes below -
// otherwise Express matches "guards"/"access-cards"/"devices" as a
// :gateId value (same bug class as Phase 4's /vehicles/visits issue).

// Security guards
router.post('/guards', authorize('SECURITY_GUARD_CREATE'), validate(createGuardSchema), controller.createGuard);
router.get('/guards', authorize('SECURITY_GUARD_READ'), validate(listGuardsQuerySchema, 'query'), controller.listGuards);
router.get('/guards/:guardId', authorize('SECURITY_GUARD_READ'), controller.getGuard);
router.patch('/guards/:guardId', authorize('SECURITY_GUARD_UPDATE'), validate(updateGuardSchema), controller.updateGuard);
router.delete('/guards/:guardId', authorize('SECURITY_GUARD_DELETE'), controller.deleteGuard);

// Access cards
router.post('/access-cards', authorize('ACCESS_CARD_CREATE'), validate(issueAccessCardSchema), controller.issueAccessCard);
router.get(
  '/access-cards',
  authorize('ACCESS_CARD_READ'),
  validate(listAccessCardsQuerySchema, 'query'),
  controller.listAccessCards
);
router.get('/access-cards/:cardId', authorize('ACCESS_CARD_READ'), controller.getAccessCard);
router.patch('/access-cards/:cardId/revoke', authorize('ACCESS_CARD_UPDATE'), controller.revokeAccessCard);

// Gate devices
router.post('/devices', authorize('GATE_DEVICE_CREATE'), validate(createGateDeviceSchema), controller.createGateDevice);
router.get('/devices/:deviceId', authorize('GATE_DEVICE_READ'), controller.getGateDevice);
router.patch(
  '/devices/:deviceId',
  authorize('GATE_DEVICE_UPDATE'),
  validate(updateGateDeviceSchema),
  controller.updateGateDevice
);
router.post(
  '/devices/:deviceId/events',
  authorize('DEVICE_EVENT_CREATE'),
  validate(ingestDeviceEventSchema),
  controller.ingestDeviceEvent
);
router.get('/devices/:deviceId/events', authorize('DEVICE_EVENT_READ'), controller.listDeviceEvents);

// Gates
router.get('/', authorize('GATE_READ'), controller.listGates);
router.post('/', authorize('GATE_CREATE'), validate(createGateSchema), controller.createGate);
router.get('/:gateId', authorize('GATE_READ'), controller.getGate);
router.put('/:gateId', authorize('GATE_UPDATE'), validate(updateGateSchema), controller.updateGate);
router.delete('/:gateId', authorize('GATE_DELETE'), controller.deleteGate);
router.get('/:gateId/devices', authorize('GATE_DEVICE_READ'), controller.listGateDevices);

module.exports = router;
