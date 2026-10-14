const ApiError = require('../../common/ApiError');
const repository = require('./gates.repository');

// --- gates -------------------------------------------------------------------

const createGate = (payload) => repository.createGate(payload);

const listGates = (societyId) => repository.listGates(societyId);

const getGate = async (id) => {
  const gate = await repository.findGateById(id);
  if (!gate) {
    throw new ApiError(404, 'Gate not found');
  }
  return gate;
};

const updateGate = async (id, payload) => {
  const gate = await repository.findGateById(id);
  if (!gate) {
    throw new ApiError(404, 'Gate not found');
  }
  return repository.updateGate(id, payload);
};

const deleteGate = async (id) => {
  const gate = await repository.findGateById(id);
  if (!gate) {
    throw new ApiError(404, 'Gate not found');
  }
  const deleted = await repository.deleteGate(id);
  if (!deleted) {
    throw new ApiError(400, 'Gate could not be deleted (it may still have devices attached)');
  }
  return deleted;
};

// --- security guards ----------------------------------------------------------

const createGuard = (payload) => repository.createGuard(payload);

const listGuards = (query) => repository.listGuards(query);

const getGuard = async (id) => {
  const guard = await repository.findGuardById(id);
  if (!guard) {
    throw new ApiError(404, 'Security guard not found');
  }
  return guard;
};

const updateGuard = async (id, payload) => {
  const guard = await repository.findGuardById(id);
  if (!guard) {
    throw new ApiError(404, 'Security guard not found');
  }
  return repository.updateGuard(id, payload);
};

const deleteGuard = async (id) => {
  const guard = await repository.findGuardById(id);
  if (!guard) {
    throw new ApiError(404, 'Security guard not found');
  }
  const deleted = await repository.deleteGuard(id);
  if (!deleted) {
    throw new ApiError(400, 'Security guard could not be deleted');
  }
  return deleted;
};

// --- access cards ---------------------------------------------------------------

const issueAccessCard = async ({ societyId, holderUserId, credentialNo, credentialType, validUntil }) => {
  const existing = await repository.findAccessCardByNo(credentialNo);
  if (existing) {
    throw new ApiError(409, 'An access card with this credential number already exists');
  }
  return repository.createAccessCard({ societyId, holderUserId, credentialNo, credentialType, validUntil });
};

const listAccessCards = (query) => repository.listAccessCards(query);

const getAccessCard = async (id) => {
  const card = await repository.findAccessCardById(id);
  if (!card) {
    throw new ApiError(404, 'Access card not found');
  }
  return card;
};

const revokeAccessCard = async (id) => {
  const card = await repository.findAccessCardById(id);
  if (!card) {
    throw new ApiError(404, 'Access card not found');
  }
  if (card.status === 'REVOKED') {
    throw new ApiError(400, 'This access card is already revoked');
  }
  return repository.updateAccessCardStatus(id, 'REVOKED');
};

// --- gate devices ------------------------------------------------------------

const createGateDevice = async ({ gateId, deviceType, serialNo, ipAddress }) => {
  const gate = await repository.findGateById(gateId);
  if (!gate) {
    throw new ApiError(404, 'Gate not found');
  }
  return repository.createGateDevice({ gateId, deviceType, serialNo, ipAddress });
};

const listGateDevices = async (gateId) => {
  const gate = await repository.findGateById(gateId);
  if (!gate) {
    throw new ApiError(404, 'Gate not found');
  }
  return repository.listGateDevices(gateId);
};

const getGateDevice = async (id) => {
  const device = await repository.findGateDeviceById(id);
  if (!device) {
    throw new ApiError(404, 'Gate device not found');
  }
  return device;
};

const updateGateDevice = async (id, payload) => {
  const device = await repository.findGateDeviceById(id);
  if (!device) {
    throw new ApiError(404, 'Gate device not found');
  }
  return repository.updateGateDevice(id, payload);
};

// --- device events --------------------------------------------------------------

const ingestDeviceEvent = async ({ gateDeviceId, externalEventId, eventType, payload }) => {
  const device = await repository.findGateDeviceById(gateDeviceId);
  if (!device) {
    throw new ApiError(404, 'Gate device not found');
  }
  return repository.createDeviceEvent({ gateDeviceId, externalEventId, eventType, payload });
};

const listDeviceEvents = async (gateDeviceId) => {
  const device = await repository.findGateDeviceById(gateDeviceId);
  if (!device) {
    throw new ApiError(404, 'Gate device not found');
  }
  return repository.listDeviceEvents(gateDeviceId);
};

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
