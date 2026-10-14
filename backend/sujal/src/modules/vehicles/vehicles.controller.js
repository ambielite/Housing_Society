const service = require('./vehicles.service');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');

// --- vehicles ---
const createVehicle = asyncHandler(async (req, res) => {
  const vehicle = await service.createVehicle(req.body);
  return ApiResponse.success(res, vehicle, 'Vehicle registered successfully', 201);
});

const listVehicles = asyncHandler(async (req, res) => {
  const result = await service.listVehicles(req.query);
  return ApiResponse.success(res, result);
});

const getVehicle = asyncHandler(async (req, res) => {
  const vehicle = await service.getVehicle(req.params.vehicleId);
  return ApiResponse.success(res, vehicle);
});

const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await service.updateVehicle(req.params.vehicleId, req.body);
  return ApiResponse.success(res, vehicle, 'Vehicle updated successfully');
});

const updateVehicleStatus = asyncHandler(async (req, res) => {
  const vehicle = await service.updateVehicleStatus(req.params.vehicleId, req.body.status);
  return ApiResponse.success(res, vehicle, 'Vehicle status updated successfully');
});

// --- credentials ---
const assignCredential = asyncHandler(async (req, res) => {
  const credential = await service.assignCredential({ vehicleId: req.params.vehicleId, ...req.body });
  return ApiResponse.success(res, credential, 'Credential assigned successfully', 201);
});

const listCredentials = asyncHandler(async (req, res) => {
  const credentials = await service.listCredentials(req.params.vehicleId);
  return ApiResponse.success(res, credentials);
});

const revokeCredential = asyncHandler(async (req, res) => {
  const credential = await service.revokeCredential(req.params.vehicleId, req.params.credentialId);
  return ApiResponse.success(res, credential, 'Credential revoked successfully');
});

// --- parking visits (gate log) ---
const logEntry = asyncHandler(async (req, res) => {
  const visit = await service.logEntry(req.body);
  return ApiResponse.success(res, visit, 'Vehicle entry logged successfully', 201);
});

const listVisits = asyncHandler(async (req, res) => {
  const visits = await service.listVisits(req.query);
  return ApiResponse.success(res, visits);
});

const getVisit = asyncHandler(async (req, res) => {
  const visit = await service.getVisit(req.params.visitId);
  return ApiResponse.success(res, visit);
});

const logExit = asyncHandler(async (req, res) => {
  const visit = await service.logExit(req.params.visitId);
  return ApiResponse.success(res, visit, 'Vehicle exit logged successfully');
});

module.exports = {
  createVehicle,
  listVehicles,
  getVehicle,
  updateVehicle,
  updateVehicleStatus,
  assignCredential,
  listCredentials,
  revokeCredential,
  logEntry,
  listVisits,
  getVisit,
  logExit,
};
