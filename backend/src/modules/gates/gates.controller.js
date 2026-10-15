const service = require('./gates.service');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');

// --- gates ---
const createGate = asyncHandler(async (req, res) => {
  const gate = await service.createGate(req.body);
  return ApiResponse.success(res, gate, 'Gate created successfully', 201);
});

const listGates = asyncHandler(async (req, res) => {
  const societyId = req.query.societyId || req.user.societyId;
  const gates = await service.listGates(societyId);
  return ApiResponse.success(res, gates);
});

const getGate = asyncHandler(async (req, res) => {
  const gate = await service.getGate(req.params.gateId);
  return ApiResponse.success(res, gate);
});

const updateGate = asyncHandler(async (req, res) => {
  const gate = await service.updateGate(req.params.gateId, req.body);
  return ApiResponse.success(res, gate, 'Gate updated successfully');
});

const deleteGate = asyncHandler(async (req, res) => {
  await service.deleteGate(req.params.gateId);
  return ApiResponse.success(res, null, 'Gate deleted successfully');
});

// --- security guards ---
const createGuard = asyncHandler(async (req, res) => {
  const guard = await service.createGuard(req.body);
  return ApiResponse.success(res, guard, 'Security guard registered successfully', 201);
});

const listGuards = asyncHandler(async (req, res) => {
  const guards = await service.listGuards(req.query);
  return ApiResponse.success(res, guards);
});

const getGuard = asyncHandler(async (req, res) => {
  const guard = await service.getGuard(req.params.guardId);
  return ApiResponse.success(res, guard);
});

const updateGuard = asyncHandler(async (req, res) => {
  const guard = await service.updateGuard(req.params.guardId, req.body);
  return ApiResponse.success(res, guard, 'Security guard updated successfully');
});

const deleteGuard = asyncHandler(async (req, res) => {
  await service.deleteGuard(req.params.guardId);
  return ApiResponse.success(res, null, 'Security guard deleted successfully');
});

// --- access cards ---
const issueAccessCard = asyncHandler(async (req, res) => {
  const card = await service.issueAccessCard(req.body);
  return ApiResponse.success(res, card, 'Access card issued successfully', 201);
});

const listAccessCards = asyncHandler(async (req, res) => {
  const cards = await service.listAccessCards(req.query);
  return ApiResponse.success(res, cards);
});

const getAccessCard = asyncHandler(async (req, res) => {
  const card = await service.getAccessCard(req.params.cardId);
  return ApiResponse.success(res, card);
});

const revokeAccessCard = asyncHandler(async (req, res) => {
  const card = await service.revokeAccessCard(req.params.cardId);
  return ApiResponse.success(res, card, 'Access card revoked successfully');
});

// --- gate devices ---
const createGateDevice = asyncHandler(async (req, res) => {
  const device = await service.createGateDevice(req.body);
  return ApiResponse.success(res, device, 'Gate device registered successfully', 201);
});

const listGateDevices = asyncHandler(async (req, res) => {
  const devices = await service.listGateDevices(req.params.gateId);
  return ApiResponse.success(res, devices);
});

const getGateDevice = asyncHandler(async (req, res) => {
  const device = await service.getGateDevice(req.params.deviceId);
  return ApiResponse.success(res, device);
});

const updateGateDevice = asyncHandler(async (req, res) => {
  const device = await service.updateGateDevice(req.params.deviceId, req.body);
  return ApiResponse.success(res, device, 'Gate device updated successfully');
});

// --- device events ---
const ingestDeviceEvent = asyncHandler(async (req, res) => {
  const event = await service.ingestDeviceEvent({ gateDeviceId: req.params.deviceId, ...req.body });
  return ApiResponse.success(res, event, 'Device event recorded successfully', 201);
});

const listDeviceEvents = asyncHandler(async (req, res) => {
  const events = await service.listDeviceEvents(req.params.deviceId);
  return ApiResponse.success(res, events);
});

module.exports = {
  createGate,
  listGates,
  getGate,
  updateGate,
  deleteGate,
  createGuard,
  listGuards,
  getGuard,
  updateGuard,
  deleteGuard,
  issueAccessCard,
  listAccessCards,
  getAccessCard,
  revokeAccessCard,
  createGateDevice,
  listGateDevices,
  getGateDevice,
  updateGateDevice,
  ingestDeviceEvent,
  listDeviceEvents,
};
