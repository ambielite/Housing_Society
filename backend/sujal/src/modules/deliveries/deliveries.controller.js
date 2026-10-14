const service = require('./deliveries.service');
const ApiResponse = require('../../common/ApiResponse');
const asyncHandler = require('../../common/asyncHandler');

// --- deliveries ---
const createDelivery = asyncHandler(async (req, res) => {
  const delivery = await service.createDelivery(req.body);
  return ApiResponse.success(res, delivery, 'Delivery registered successfully', 201);
});

const listDeliveries = asyncHandler(async (req, res) => {
  const deliveries = await service.listDeliveries(req.query);
  return ApiResponse.success(res, deliveries);
});

const getDelivery = asyncHandler(async (req, res) => {
  const delivery = await service.getDelivery(req.params.deliveryId);
  return ApiResponse.success(res, delivery);
});

const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { status, ...timestamps } = req.body;
  const delivery = await service.updateDeliveryStatus(req.params.deliveryId, status, timestamps);
  return ApiResponse.success(res, delivery, 'Delivery status updated successfully');
});

// --- parcels ---
const createParcel = asyncHandler(async (req, res) => {
  const parcel = await service.createParcel(req.body);
  return ApiResponse.success(res, parcel, 'Parcel logged successfully', 201);
});

const listParcels = asyncHandler(async (req, res) => {
  const parcels = await service.listParcels(req.query);
  return ApiResponse.success(res, parcels);
});

const getParcel = asyncHandler(async (req, res) => {
  const parcel = await service.getParcel(req.params.parcelId);
  return ApiResponse.success(res, parcel);
});

const updateParcelStatus = asyncHandler(async (req, res) => {
  const parcel = await service.updateParcelStatus(req.params.parcelId, req.body.status, req.body.collectedBy);
  return ApiResponse.success(res, parcel, 'Parcel status updated successfully');
});

module.exports = {
  createDelivery,
  listDeliveries,
  getDelivery,
  updateDeliveryStatus,
  createParcel,
  listParcels,
  getParcel,
  updateParcelStatus,
};
