const service = require('./utility-setup.service');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');

// --- utility types ---
const createType = asyncHandler(async (req, res) => {
  const type = await service.createType(req.body);
  return ApiResponse.success(res, type, 'Utility type created successfully', 201);
});

const listTypes = asyncHandler(async (req, res) => {
  const types = await service.listTypes(req.query);
  return ApiResponse.success(res, types);
});

const getType = asyncHandler(async (req, res) => {
  const type = await service.getType(req.params.typeId);
  return ApiResponse.success(res, type);
});

const updateType = asyncHandler(async (req, res) => {
  const type = await service.updateType(req.params.typeId, req.body);
  return ApiResponse.success(res, type, 'Utility type updated successfully');
});

const deleteType = asyncHandler(async (req, res) => {
  await service.deleteType(req.params.typeId);
  return ApiResponse.success(res, null, 'Utility type deleted successfully');
});

// --- meters ---
const createMeter = asyncHandler(async (req, res) => {
  const meter = await service.createMeter(req.body);
  return ApiResponse.success(res, meter, 'Meter created successfully', 201);
});

const listMeters = asyncHandler(async (req, res) => {
  const meters = await service.listMeters(req.query);
  return ApiResponse.success(res, meters);
});

const getMeter = asyncHandler(async (req, res) => {
  const meter = await service.getMeter(req.params.meterId);
  return ApiResponse.success(res, meter);
});

const updateMeter = asyncHandler(async (req, res) => {
  const meter = await service.updateMeter(req.params.meterId, req.body);
  return ApiResponse.success(res, meter, 'Meter updated successfully');
});

const deleteMeter = asyncHandler(async (req, res) => {
  await service.deleteMeter(req.params.meterId);
  return ApiResponse.success(res, null, 'Meter deleted successfully');
});

const replaceMeter = asyncHandler(async (req, res) => {
  const result = await service.replaceMeter(req.params.meterId, req.body);
  return ApiResponse.success(res, result, 'Meter replaced successfully', 201);
});

// --- tariffs ---
const createTariff = asyncHandler(async (req, res) => {
  const tariff = await service.createTariff(req.body);
  return ApiResponse.success(res, tariff, 'Tariff created successfully', 201);
});

const listTariffs = asyncHandler(async (req, res) => {
  const tariffs = await service.listTariffs(req.params.typeId);
  return ApiResponse.success(res, tariffs);
});

const updateTariff = asyncHandler(async (req, res) => {
  const tariff = await service.updateTariff(req.params.tariffId, req.body);
  return ApiResponse.success(res, tariff, 'Tariff updated successfully');
});

const deleteTariff = asyncHandler(async (req, res) => {
  await service.deleteTariff(req.params.tariffId);
  return ApiResponse.success(res, null, 'Tariff deleted successfully');
});

module.exports = {
  createType,
  listTypes,
  getType,
  updateType,
  deleteType,
  createMeter,
  listMeters,
  getMeter,
  updateMeter,
  deleteMeter,
  replaceMeter,
  createTariff,
  listTariffs,
  updateTariff,
  deleteTariff,
};
