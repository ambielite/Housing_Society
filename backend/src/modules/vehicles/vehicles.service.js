const ApiError = require('../../common/ApiError');
const { getPagination } = require('../../common/pagination');
const repository = require('./vehicles.repository');
const parkingRepository = require('../parking/parking.repository');

// --- vehicles ---------------------------------------------------------------

const createVehicle = async ({ societyId, ownerUserId, unitId, registrationNo, vehicleType, make, model, color }) => {
  const existing = await repository.findByRegistration(societyId, registrationNo);
  if (existing) {
    throw new ApiError(409, 'A vehicle with this registration number already exists in this society');
  }
  return repository.createVehicle({ societyId, ownerUserId, unitId, registrationNo, vehicleType, make, model, color });
};

const listVehicles = async (query) => {
  const { page, limit, offset } = getPagination(query);
  const { rows, total } = await repository.listVehicles({
    societyId: query.societyId,
    unitId: query.unitId,
    ownerUserId: query.ownerUserId,
    status: query.status,
    limit,
    offset,
  });
  return {
    vehicles: rows,
    pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
  };
};

const getVehicle = async (id) => {
  const vehicle = await repository.findById(id);
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }
  return vehicle;
};

const updateVehicle = async (id, payload) => {
  const vehicle = await repository.findById(id);
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }
  return repository.updateVehicle(id, payload);
};

const updateVehicleStatus = async (id, status) => {
  const vehicle = await repository.findById(id);
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }
  return repository.updateVehicleStatus(id, status);
};

// --- vehicle credentials ---------------------------------------------------

const assignCredential = async ({ vehicleId, credentialType, credentialValue, expiresAt }) => {
  const vehicle = await repository.findById(vehicleId);
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }

  // Business rule (spec Section 10): "RFID must not be simultaneously
  // active for unrelated vehicles" - the DB's UNIQUE(credential_value)
  // already prevents this globally; this check gives a clean 409 instead
  // of a raw DB constraint error.
  const existing = await repository.findCredentialByValue(credentialValue);
  if (existing) {
    throw new ApiError(409, 'This credential value is already assigned to a vehicle');
  }

  return repository.createCredential({ vehicleId, credentialType, credentialValue, expiresAt });
};

const listCredentials = async (vehicleId) => {
  const vehicle = await repository.findById(vehicleId);
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }
  return repository.listCredentialsForVehicle(vehicleId);
};

const revokeCredential = async (vehicleId, credentialId) => {
  const credential = await repository.findCredentialById(credentialId);
  if (!credential || credential.vehicle_id !== vehicleId) {
    throw new ApiError(404, 'Credential not found for this vehicle');
  }
  return repository.revokeCredential(credentialId);
};

// --- parking visits (vehicle gate log) --------------------------------------

const logEntry = async ({ societyId, vehicleId, visitorId, slotId }) => {
  const slot = await parkingRepository.findSlotById(slotId);
  if (!slot) {
    throw new ApiError(404, 'Parking slot not found');
  }

  const openVisit = await repository.findOpenVisitForSlot(slotId);
  if (openVisit) {
    throw new ApiError(409, 'This slot already has a vehicle logged as inside');
  }

  if (vehicleId) {
    const vehicle = await repository.findById(vehicleId);
    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found');
    }
  }

  return repository.createVisit({ societyId, vehicleId, visitorId, slotId });
};

const listVisits = (query) => repository.listVisits(query);

const getVisit = async (id) => {
  const visit = await repository.findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'Parking visit not found');
  }
  return visit;
};

const logExit = async (id) => {
  const visit = await repository.findVisitById(id);
  if (!visit) {
    throw new ApiError(404, 'Parking visit not found');
  }
  if (visit.status !== 'INSIDE') {
    throw new ApiError(400, 'This visit has already been closed');
  }
  return repository.closeVisit(id, 'EXITED');
};

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
