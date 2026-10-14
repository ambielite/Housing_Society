const ApiError = require('../../common/ApiError');
const repository = require('./deliveries.repository');

/**
 * The doc lists the full set of Delivery Statuses (Section 18) but does
 * not spell out the exact allowed transition graph between them - this
 * is my best-effort interpretation of a sensible delivery flow, not a
 * literal doc requirement. Flagged here in case it needs adjusting:
 *   EXPECTED -> ARRIVED | CANCELLED
 *   ARRIVED  -> INSIDE | LEFT_AT_GATE | CANCELLED
 *   INSIDE   -> PICKED_UP | EXITED | OVERSTAY | CANCELLED
 *   LEFT_AT_GATE -> PICKED_UP | OVERSTAY
 *   OVERSTAY -> PICKED_UP | EXITED
 *   PICKED_UP -> EXITED
 *   EXITED / CANCELLED -> (terminal)
 */
const ALLOWED_TRANSITIONS = {
  EXPECTED: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['INSIDE', 'LEFT_AT_GATE', 'CANCELLED'],
  INSIDE: ['PICKED_UP', 'EXITED', 'OVERSTAY', 'CANCELLED'],
  LEFT_AT_GATE: ['PICKED_UP', 'OVERSTAY'],
  OVERSTAY: ['PICKED_UP', 'EXITED'],
  PICKED_UP: ['EXITED'],
  EXITED: [],
  CANCELLED: [],
};

// --- deliveries --------------------------------------------------------------

const createDelivery = (payload) => repository.createDelivery(payload);

const listDeliveries = (query) => repository.listDeliveries(query);

const getDelivery = async (id) => {
  const delivery = await repository.findDeliveryById(id);
  if (!delivery) {
    throw new ApiError(404, 'Delivery not found');
  }
  const parcels = await repository.listParcels({ deliveryId: id });
  return { ...delivery, parcels };
};

const updateDeliveryStatus = async (id, status, timestamps) => {
  const delivery = await repository.findDeliveryById(id);
  if (!delivery) {
    throw new ApiError(404, 'Delivery not found');
  }
  const allowed = ALLOWED_TRANSITIONS[delivery.status] || [];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `Cannot move a ${delivery.status} delivery to ${status}`);
  }
  return repository.updateDeliveryStatus(id, status, timestamps);
};

// --- parcels (leave-at-gate storage) -------------------------------------------

const createParcel = async ({ deliveryId, parcelCode, storageLocation, receivedBy }) => {
  const delivery = await repository.findDeliveryById(deliveryId);
  if (!delivery) {
    throw new ApiError(404, 'Delivery not found');
  }
  return repository.createParcel({ deliveryId, parcelCode, storageLocation, receivedBy });
};

const listParcels = (query) => repository.listParcels(query);

const getParcel = async (id) => {
  const parcel = await repository.findParcelById(id);
  if (!parcel) {
    throw new ApiError(404, 'Parcel not found');
  }
  return parcel;
};

const updateParcelStatus = async (id, status, collectedBy) => {
  const parcel = await repository.findParcelById(id);
  if (!parcel) {
    throw new ApiError(404, 'Parcel not found');
  }
  if (parcel.status !== 'STORED') {
    throw new ApiError(400, `This parcel is already ${parcel.status}`);
  }
  const updated = await repository.updateParcelStatus(id, status, collectedBy);

  // Keep the parent delivery's status in sync when the parcel is collected
  if (status === 'COLLECTED') {
    const delivery = await repository.findDeliveryById(parcel.delivery_id);
    if (delivery && (delivery.status === 'LEFT_AT_GATE' || delivery.status === 'OVERSTAY')) {
      await repository.updateDeliveryStatus(parcel.delivery_id, 'PICKED_UP', {});
    }
  }

  return updated;
};

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
