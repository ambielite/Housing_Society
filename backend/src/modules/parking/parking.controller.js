const service = require('./parking.service');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');

// --- areas ---
const createArea = asyncHandler(async (req, res) => {
  const area = await service.createArea(req.body);
  return ApiResponse.success(res, area, 'Parking area created successfully', 201);
});

const listAreas = asyncHandler(async (req, res) => {
  const societyId = req.query.societyId || req.user.societyId;
  const areas = await service.listAreas(societyId);
  return ApiResponse.success(res, areas);
});

const getArea = asyncHandler(async (req, res) => {
  const area = await service.getArea(req.params.areaId);
  return ApiResponse.success(res, area);
});

const updateArea = asyncHandler(async (req, res) => {
  const area = await service.updateArea(req.params.areaId, req.body);
  return ApiResponse.success(res, area, 'Parking area updated successfully');
});

const deleteArea = asyncHandler(async (req, res) => {
  await service.deleteArea(req.params.areaId);
  return ApiResponse.success(res, null, 'Parking area deleted successfully');
});

// --- slots ---
const createSlot = asyncHandler(async (req, res) => {
  const slot = await service.createSlot(req.body);
  return ApiResponse.success(res, slot, 'Parking slot created successfully', 201);
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
  return ApiResponse.success(res, slot, 'Parking slot updated successfully');
});

const deleteSlot = asyncHandler(async (req, res) => {
  await service.deleteSlot(req.params.slotId);
  return ApiResponse.success(res, null, 'Parking slot deleted successfully');
});

// --- allocations ---
const createAllocation = asyncHandler(async (req, res) => {
  const allocation = await service.createAllocation(req.body);
  return ApiResponse.success(res, allocation, 'Parking slot allocated successfully', 201);
});

const listAllocations = asyncHandler(async (req, res) => {
  const allocations = await service.listAllocations(req.query);
  return ApiResponse.success(res, allocations);
});

const getAllocation = asyncHandler(async (req, res) => {
  const allocation = await service.getAllocation(req.params.allocationId);
  return ApiResponse.success(res, allocation);
});

const endAllocation = asyncHandler(async (req, res) => {
  const allocation = await service.endAllocation(req.params.allocationId, req.body);
  return ApiResponse.success(res, allocation, 'Allocation ended successfully');
});

const deleteAllocation = asyncHandler(async (req, res) => {
  await service.deleteAllocation(req.params.allocationId);
  return ApiResponse.success(res, null, 'Allocation deleted successfully');
});

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
