const service = require('./amenities.service');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');

// --- amenities ---
const createAmenity = asyncHandler(async (req, res) => {
  const amenity = await service.createAmenity(req.body);
  return ApiResponse.success(res, amenity, 'Amenity created successfully', 201);
});

const listAmenities = asyncHandler(async (req, res) => {
  const amenities = await service.listAmenities(req.query);
  return ApiResponse.success(res, amenities);
});

const getAmenity = asyncHandler(async (req, res) => {
  const amenity = await service.getAmenity(req.params.amenityId);
  return ApiResponse.success(res, amenity);
});

const updateAmenity = asyncHandler(async (req, res) => {
  const amenity = await service.updateAmenity(req.params.amenityId, req.body);
  return ApiResponse.success(res, amenity, 'Amenity updated successfully');
});

const deleteAmenity = asyncHandler(async (req, res) => {
  await service.deleteAmenity(req.params.amenityId);
  return ApiResponse.success(res, null, 'Amenity deleted successfully');
});

// --- slots ---
const createSlot = asyncHandler(async (req, res) => {
  const slot = await service.createSlot(req.body);
  return ApiResponse.success(res, slot, 'Amenity slot created successfully', 201);
});

const listSlots = asyncHandler(async (req, res) => {
  const slots = await service.listSlots(req.query);
  return ApiResponse.success(res, slots);
});

const getSlot = asyncHandler(async (req, res) => {
  const slot = await service.getSlot(req.params.slotId);
  return ApiResponse.success(res, slot);
});

const updateSlot = asyncHandler(async (req, res) => {
  const slot = await service.updateSlot(req.params.slotId, req.body);
  return ApiResponse.success(res, slot, 'Amenity slot updated successfully');
});

const deleteSlot = asyncHandler(async (req, res) => {
  await service.deleteSlot(req.params.slotId);
  return ApiResponse.success(res, null, 'Amenity slot deleted successfully');
});

// --- pricing rules ---
const createPricingRule = asyncHandler(async (req, res) => {
  const rule = await service.createPricingRule(req.body);
  return ApiResponse.success(res, rule, 'Pricing rule created successfully', 201);
});

const listPricingRules = asyncHandler(async (req, res) => {
  const rules = await service.listPricingRules(req.params.amenityId);
  return ApiResponse.success(res, rules);
});

const updatePricingRule = asyncHandler(async (req, res) => {
  const rule = await service.updatePricingRule(req.params.ruleId, req.body);
  return ApiResponse.success(res, rule, 'Pricing rule updated successfully');
});

const deletePricingRule = asyncHandler(async (req, res) => {
  await service.deletePricingRule(req.params.ruleId);
  return ApiResponse.success(res, null, 'Pricing rule deleted successfully');
});

// --- blockouts ---
const createBlockout = asyncHandler(async (req, res) => {
  const blockout = await service.createBlockout({ ...req.body, createdBy: req.user.id });
  return ApiResponse.success(res, blockout, 'Blockout created successfully', 201);
});

const listBlockouts = asyncHandler(async (req, res) => {
  const blockouts = await service.listBlockouts(req.params.amenityId);
  return ApiResponse.success(res, blockouts);
});

const deleteBlockout = asyncHandler(async (req, res) => {
  await service.deleteBlockout(req.params.blockoutId);
  return ApiResponse.success(res, null, 'Blockout removed successfully');
});

module.exports = {
  createAmenity,
  listAmenities,
  getAmenity,
  updateAmenity,
  deleteAmenity,
  createSlot,
  listSlots,
  getSlot,
  updateSlot,
  deleteSlot,
  createPricingRule,
  listPricingRules,
  updatePricingRule,
  deletePricingRule,
  createBlockout,
  listBlockouts,
  deleteBlockout,
};
