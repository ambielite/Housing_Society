const express = require('express');
const controller = require('./parking.controller');
const validate = require('../../common/validate');
const {
  createAreaSchema,
  updateAreaSchema,
  createSlotSchema,
  updateSlotSchema,
  listSlotsQuerySchema,
  createAllocationSchema,
  listAllocationsQuerySchema,
  endAllocationSchema,
} = require('./parking.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();

router.use(authenticate);

// Areas
router.get('/areas', authorize('PARKING_AREA_READ'), controller.listAreas);
router.post('/areas', authorize('PARKING_AREA_CREATE'), validate(createAreaSchema), controller.createArea);
router.get('/areas/:areaId', authorize('PARKING_AREA_READ'), controller.getArea);
router.put('/areas/:areaId', authorize('PARKING_AREA_UPDATE'), validate(updateAreaSchema), controller.updateArea);
router.delete('/areas/:areaId', authorize('PARKING_AREA_DELETE'), controller.deleteArea);

// Slots
router.get('/slots', authorize('PARKING_SLOT_READ'), validate(listSlotsQuerySchema, 'query'), controller.listSlots);
router.post('/slots', authorize('PARKING_SLOT_CREATE'), validate(createSlotSchema), controller.createSlot);
router.get('/slots/:slotId', authorize('PARKING_SLOT_READ'), controller.getSlot);
router.put('/slots/:slotId', authorize('PARKING_SLOT_UPDATE'), validate(updateSlotSchema), controller.updateSlot);
router.delete('/slots/:slotId', authorize('PARKING_SLOT_DELETE'), controller.deleteSlot);

// Allocations
router.get(
  '/allocations',
  authorize('PARKING_ALLOCATION_READ'),
  validate(listAllocationsQuerySchema, 'query'),
  controller.listAllocations
);
router.post(
  '/allocations',
  authorize('PARKING_ALLOCATION_CREATE'),
  validate(createAllocationSchema),
  controller.createAllocation
);
router.get('/allocations/:allocationId', authorize('PARKING_ALLOCATION_READ'), controller.getAllocation);
router.patch(
  '/allocations/:allocationId/end',
  authorize('PARKING_ALLOCATION_UPDATE'),
  validate(endAllocationSchema),
  controller.endAllocation
);
router.delete('/allocations/:allocationId', authorize('PARKING_ALLOCATION_DELETE'), controller.deleteAllocation);

module.exports = router;
