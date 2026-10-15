const ApiError = require('../../common/ApiError');
const repository = require('./parking.repository');




const DUPLICATE_AREA_MESSAGE = 'A parking area with this name already exists in this society';

// --- parking areas -----------------------------------------------------------

// const createArea = (payload) => repository.createArea(payload); // old one 

// CHANGED: rejects a second area with the same name in the same society,
// whether the existing one is active or inactive.
const createArea = async (payload) => {                                  // new one 
  const duplicate = await repository.findAreaByName(payload.societyId, payload.name);
  if (duplicate) {
    throw new ApiError(409, DUPLICATE_AREA_MESSAGE);
  }
  return repository.createArea(payload);
};

const listAreas = (societyId) => repository.listAreas(societyId);

const getArea = async (id) => {
  const area = await repository.findAreaById(id);
  if (!area) {
    throw new ApiError(404, 'Parking area not found');
  }
  return area;
};


// old one 

// const updateArea = async (id, payload) => {
//   const area = await repository.findAreaById(id);
//   if (!area) {
//     throw new ApiError(404, 'Parking area not found');
//   }
//   return repository.updateArea(id, payload);
// };


// CHANGED: renaming an area to a name another area already uses is also rejected.   // new one 
const updateArea = async (id, payload) => {
  const area = await repository.findAreaById(id);
  if (!area) {
    throw new ApiError(404, 'Parking area not found');
  }
  if (payload.name) {
    const duplicate = await repository.findAreaByName(area.society_id, payload.name);
    if (duplicate && duplicate.id !== id) {
      throw new ApiError(409, DUPLICATE_AREA_MESSAGE);
    }
  }
  return repository.updateArea(id, payload);
};

const deleteArea = async (id) => {
  const area = await repository.findAreaById(id);
  if (!area) {
    throw new ApiError(404, 'Parking area not found');
  }
  const deleted = await repository.deleteArea(id);
  if (!deleted) {
    throw new ApiError(400, 'Parking area could not be deleted (it may still have slots attached)');
  }
  return deleted;
};

// --- parking slots -------------------------------------------------------------

const createSlot = async (payload) => {
  const area = await repository.findAreaById(payload.parkingAreaId);
  if (!area) {
    throw new ApiError(404, 'Parking area not found');
  }
  return repository.createSlot(payload);
};

const listSlots = (query) => repository.listSlots(query);

const getSlot = async (id) => {
  const slot = await repository.findSlotById(id);
  if (!slot) {
    throw new ApiError(404, 'Parking slot not found');
  }
  return slot;
};

const updateSlot = async (id, payload) => {
  const slot = await repository.findSlotById(id);
  if (!slot) {
    throw new ApiError(404, 'Parking slot not found');
  }
  return repository.updateSlot(id, payload);
};

const deleteSlot = async (id) => {
  const slot = await repository.findSlotById(id);
  if (!slot) {
    throw new ApiError(404, 'Parking slot not found');
  }
  const deleted = await repository.deleteSlot(id);
  if (!deleted) {
    throw new ApiError(400, 'Parking slot could not be deleted (it may still have allocations attached)');
  }
  return deleted;
};

// --- parking allocations -----------------------------------------------------

const createAllocation = async ({ slotId, unitId, userId, allocationType, startDate, endDate, fee }) => {
  const slot = await repository.findSlotById(slotId);
  if (!slot) {
    throw new ApiError(404, 'Parking slot not found');
  }
  if (slot.status !== 'ACTIVE') {
    throw new ApiError(400, 'This parking slot is not active');
  }

  // Business rule (spec Section 10): one active allocation per restricted
  // bay at a time. The DB has a matching partial unique index as a
  // second line of defense, but we check here first for a clean 409.
  const existingActive = await repository.findActiveAllocationForSlot(slotId);
  if (existingActive) {
    throw new ApiError(409, 'This parking slot already has an active allocation');
  }

  return repository.createAllocation({ slotId, unitId, userId, allocationType, startDate, endDate, fee });
};

const listAllocations = (query) => repository.listAllocations(query);

const getAllocation = async (id) => {
  const allocation = await repository.findAllocationById(id);
  if (!allocation) {
    throw new ApiError(404, 'Parking allocation not found');
  }
  return allocation;
};

/**
 * Ends/cancels an allocation (status -> EXPIRED or CANCELLED), freeing up
 * the slot for a new allocation. There is no background scheduler yet
 * (that's Phase 37), so "revert on expiry" is handled by this explicit
 * endpoint rather than an automatic job for now.
 */
const endAllocation = async (id, { status, endDate }) => {
  const allocation = await repository.findAllocationById(id);
  if (!allocation) {
    throw new ApiError(404, 'Parking allocation not found');
  }
  if (allocation.status !== 'ACTIVE') {
    throw new ApiError(400, 'This allocation is not currently active');
  }
  return repository.updateAllocationStatus(id, status, endDate);
};

const deleteAllocation = async (id) => {
  const allocation = await repository.findAllocationById(id);
  if (!allocation) {
    throw new ApiError(404, 'Parking allocation not found');
  }
  const deleted = await repository.deleteAllocation(id);
  if (!deleted) {
    throw new ApiError(400, 'Allocation could not be deleted');
  }
  return deleted;
};

module.exports = {
  createArea,
  listAreas,
  getArea,
  updateArea,
  deleteArea,
  createSlot,
  listSlots,
  getSlot,
  updateSlot,
  deleteSlot,
  createAllocation,
  listAllocations,
  getAllocation,
  endAllocation,
  deleteAllocation,
};
