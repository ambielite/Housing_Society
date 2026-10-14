const ApiError = require('../../common/ApiError');
const repository = require('./amenities.repository');

// --- amenities -----------------------------------------------------------------

const createAmenity = (payload) => repository.createAmenity(payload);

const listAmenities = (query) => repository.listAmenities(query);

const getAmenity = async (id) => {
  const amenity = await repository.findAmenityById(id);
  if (!amenity) {
    throw new ApiError(404, 'Amenity not found');
  }
  return amenity;
};

const updateAmenity = async (id, payload) => {
  const amenity = await repository.findAmenityById(id);
  if (!amenity) {
    throw new ApiError(404, 'Amenity not found');
  }
  return repository.updateAmenity(id, payload);
};

const deleteAmenity = async (id) => {
  const amenity = await repository.findAmenityById(id);
  if (!amenity) {
    throw new ApiError(404, 'Amenity not found');
  }
  const deleted = await repository.deleteAmenity(id);
  if (!deleted) {
    throw new ApiError(400, 'Amenity could not be deleted (it may still have slots attached)');
  }
  return deleted;
};

// --- amenity slots ---------------------------------------------------------------

const createSlot = async (payload) => {
  const amenity = await repository.findAmenityById(payload.amenityId);
  if (!amenity) {
    throw new ApiError(404, 'Amenity not found');
  }

  // Reject a slot that falls inside an active blockout window.
  // payload.slotDate is a JS Date object (Joi converts it during
  // validation), so it must go through toISOString() to get a plain
  // "YYYY-MM-DD" string before building the start/end timestamps.
  const dateStr = payload.slotDate.toISOString().slice(0, 10);
  const slotStart = new Date(`${dateStr}T${payload.startTime}`);
  const slotEnd = new Date(`${dateStr}T${payload.endTime}`);
  const overlap = await repository.findOverlappingBlockout(payload.amenityId, slotStart, slotEnd);
  if (overlap) {
    throw new ApiError(400, 'This slot overlaps an active blockout window for this amenity');
  }

  return repository.createSlot(payload);
};

const listSlots = (query) => repository.listSlots(query);

const getSlot = async (id) => {
  const slot = await repository.findSlotById(id);
  if (!slot) {
    throw new ApiError(404, 'Amenity slot not found');
  }
  return slot;
};

const updateSlot = async (id, payload) => {
  const slot = await repository.findSlotById(id);
  if (!slot) {
    throw new ApiError(404, 'Amenity slot not found');
  }
  return repository.updateSlot(id, payload);
};

const deleteSlot = async (id) => {
  const slot = await repository.findSlotById(id);
  if (!slot) {
    throw new ApiError(404, 'Amenity slot not found');
  }
  const deleted = await repository.deleteSlot(id);
  if (!deleted) {
    throw new ApiError(400, 'Slot could not be deleted (it may still have bookings attached)');
  }
  return deleted;
};

// --- pricing rules -----------------------------------------------------------------

const createPricingRule = async (payload) => {
  const amenity = await repository.findAmenityById(payload.amenityId);
  if (!amenity) {
    throw new ApiError(404, 'Amenity not found');
  }
  return repository.createPricingRule(payload);
};

const listPricingRules = async (amenityId) => {
  const amenity = await repository.findAmenityById(amenityId);
  if (!amenity) {
    throw new ApiError(404, 'Amenity not found');
  }
  return repository.listPricingRules(amenityId);
};

const updatePricingRule = async (id, payload) => {
  const rule = await repository.findPricingRuleById(id);
  if (!rule) {
    throw new ApiError(404, 'Pricing rule not found');
  }
  return repository.updatePricingRule(id, payload);
};

const deletePricingRule = async (id) => {
  const rule = await repository.findPricingRuleById(id);
  if (!rule) {
    throw new ApiError(404, 'Pricing rule not found');
  }
  return repository.deletePricingRule(id);
};

// --- blockouts -----------------------------------------------------------------------

const createBlockout = async (payload) => {
  const amenity = await repository.findAmenityById(payload.amenityId);
  if (!amenity) {
    throw new ApiError(404, 'Amenity not found');
  }
  return repository.createBlockout(payload);
};

const listBlockouts = async (amenityId) => {
  const amenity = await repository.findAmenityById(amenityId);
  if (!amenity) {
    throw new ApiError(404, 'Amenity not found');
  }
  return repository.listBlockouts(amenityId);
};

const deleteBlockout = async (id) => {
  const blockout = await repository.findBlockoutById(id);
  if (!blockout) {
    throw new ApiError(404, 'Blockout not found');
  }
  return repository.deleteBlockout(id);
};

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