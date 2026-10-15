const express = require('express');
const controller = require('./amenities.controller');
const validate = require('../../common/validate');
const {
  createAmenitySchema,
  listAmenitiesQuerySchema,
  updateAmenitySchema,
  createSlotSchema,
  listSlotsQuerySchema,
  updateSlotSchema,
  createPricingRuleSchema,
  updatePricingRuleSchema,
  createBlockoutSchema,
} = require('./amenities.validation');
const { authenticate, authorize } = require('../../common/authMiddleware');

const router = express.Router();

router.use(authenticate);

// IMPORTANT: these static-prefixed routes (/slots, /pricing-rules,
// /blockouts) must be declared BEFORE the "/:amenityId" routes below -
// same ordering rule that fixed the Phase 4 vehicles/visits bug.

// Amenity slots
router.post('/slots', authorize('AMENITY_SLOT_CREATE'), validate(createSlotSchema), controller.createSlot);
router.get('/slots', authorize('AMENITY_SLOT_READ'), validate(listSlotsQuerySchema, 'query'), controller.listSlots);
router.get('/slots/:slotId', authorize('AMENITY_SLOT_READ'), controller.getSlot);
router.put('/slots/:slotId', authorize('AMENITY_SLOT_UPDATE'), validate(updateSlotSchema), controller.updateSlot);
router.delete('/slots/:slotId', authorize('AMENITY_SLOT_DELETE'), controller.deleteSlot);

// Pricing rules
router.post(
  '/pricing-rules',
  authorize('AMENITY_PRICING_RULE_CREATE'),
  validate(createPricingRuleSchema),
  controller.createPricingRule
);
router.put(
  '/pricing-rules/:ruleId',
  authorize('AMENITY_PRICING_RULE_UPDATE'),
  validate(updatePricingRuleSchema),
  controller.updatePricingRule
);
router.delete('/pricing-rules/:ruleId', authorize('AMENITY_PRICING_RULE_DELETE'), controller.deletePricingRule);

// Blockouts
router.post('/blockouts', authorize('AMENITY_BLOCKOUT_CREATE'), validate(createBlockoutSchema), controller.createBlockout);
router.delete('/blockouts/:blockoutId', authorize('AMENITY_BLOCKOUT_DELETE'), controller.deleteBlockout);

// Amenities
router.get('/', authorize('AMENITY_READ'), validate(listAmenitiesQuerySchema, 'query'), controller.listAmenities);
router.post('/', authorize('AMENITY_CREATE'), validate(createAmenitySchema), controller.createAmenity);
router.get('/:amenityId', authorize('AMENITY_READ'), controller.getAmenity);
router.put('/:amenityId', authorize('AMENITY_UPDATE'), validate(updateAmenitySchema), controller.updateAmenity);
router.delete('/:amenityId', authorize('AMENITY_DELETE'), controller.deleteAmenity);
router.get('/:amenityId/pricing-rules', authorize('AMENITY_PRICING_RULE_READ'), controller.listPricingRules);
router.get('/:amenityId/blockouts', authorize('AMENITY_BLOCKOUT_READ'), controller.listBlockouts);

module.exports = router;
