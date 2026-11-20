const ApiError = require('../../common/ApiError');
const repository = require('./deliveries.repository');
const visitorsRepository = require('../visitors/visitors.repository');
const gatesRepository = require('../gates/gates.repository');

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

const createDelivery = async (payload) => {
  const destinations = await visitorsRepository.listDestinations(payload.societyId);
  const destination = destinations.find((item) => item.unit_id === payload.unitId);
  if (!destination) throw new ApiError(400, 'The selected flat has no active resident');
  const [gate] = await gatesRepository.listGates(payload.societyId);
  if (!gate) throw new ApiError(409, 'No gate is configured for this society');

  let profile;
  if (payload.visitorProfileId) {
    profile = await visitorsRepository.findProfileById(payload.visitorProfileId);
    if (!profile || profile.society_id !== payload.societyId) {
      throw new ApiError(400, 'Select a visitor profile from this society');
    }
    if (profile.blacklist_status === 'BLACKLISTED') {
      throw new ApiError(400, 'This visitor is blacklisted and cannot be registered');
    }
  } else {
    const courierName = payload.courierName?.trim() || 'Delivery courier';
    profile = await visitorsRepository.createProfile({
      societyId: payload.societyId,
      name: courierName,
      visitorType: 'DELIVERY_PERSON',
      deliveryCompany: courierName,
    });
  }

  const delivery = await repository.createDelivery({
    ...payload,
    visitorProfileId: profile.id,
  });
  const pass = await visitorsRepository.createPass({
    visitorProfileId: profile.id,
    gateId: gate.id,
    passNo: `DEL-${delivery.id}`,
    unitId: payload.unitId,
    residentId: destination.resident_id,
  });
  return repository.linkVisitorPass(delivery.id, pass.id);
};

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
  if (status === 'INSIDE' && delivery.visitor_pass_id &&
      delivery.resident_decision !== 'APPROVED') {
    throw new ApiError(403, 'Wait for the resident to approve this delivery before allowing entry');
  }
  return repository.updateDeliveryStatus(id, status, timestamps);
};

// --- parcels (leave-at-gate storage) -------------------------------------------

const createParcel = async ({ deliveryId, parcelCode, storageLocation, receivedBy }) => {
  const delivery = await repository.findDeliveryById(deliveryId);
  if (!delivery) {
    throw new ApiError(404, 'Delivery not found');
  }
  const parcel = await repository.createParcel({ deliveryId, parcelCode, storageLocation, receivedBy });
  await repository.notifyUnitResidents({
    societyId: delivery.society_id,
    unitId: delivery.unit_id,
    title: 'Parcel logged at the gate',
    message: `Security logged a parcel${storageLocation ? ` stored at ${storageLocation}` : ''}.`,
    referenceType: 'PARCEL',
    referenceId: parcel.id,
  });
  return parcel;
};

const listResidentNotifications = (user) => {
  if (!user.societyId) throw new ApiError(403, 'Your account is not linked to a society');
  return repository.listResidentNotifications(user.id, user.societyId);
};

const markResidentNotificationRead = async (user, id) => {
  if (!user.societyId) throw new ApiError(403, 'Your account is not linked to a society');
  const updated = await repository.markResidentNotificationRead(id, user.id, user.societyId);
  if (!updated) throw new ApiError(404, 'Notification not found');
  return updated;
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
  listResidentNotifications,
  markResidentNotificationRead,
  listDeliveries,
  getDelivery,
  updateDeliveryStatus,
  createParcel,
  listParcels,
  getParcel,
  updateParcelStatus,
};
