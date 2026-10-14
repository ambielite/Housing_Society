const ApiError = require('../../common/ApiError');
const repository = require('./utility-setup.repository');

// --- utility types --------------------------------------------------------------

const createType = (payload) => repository.createType(payload);
const listTypes = (query) => repository.listTypes(query);

const getType = async (id) => {
  const type = await repository.findTypeById(id);
  if (!type) throw new ApiError(404, 'Utility type not found');
  return type;
};

const updateType = async (id, payload) => {
  const type = await repository.findTypeById(id);
  if (!type) throw new ApiError(404, 'Utility type not found');
  return repository.updateType(id, payload);
};

const deleteType = async (id) => {
  const type = await repository.findTypeById(id);
  if (!type) throw new ApiError(404, 'Utility type not found');
  const deleted = await repository.deleteType(id);
  if (!deleted) throw new ApiError(400, 'Utility type could not be deleted (it may still be referenced by meters/tariffs)');
  return deleted;
};

// --- meters ---------------------------------------------------------------------

const createMeter = async (payload) => {
  const type = await repository.findTypeById(payload.utilityTypeId);
  if (!type) throw new ApiError(404, 'Utility type not found');
  return repository.createMeter(payload);
};

const listMeters = (query) => repository.listMeters(query);

const getMeter = async (id) => {
  const meter = await repository.findMeterById(id);
  if (!meter) throw new ApiError(404, 'Meter not found');
  return meter;
};

const updateMeter = async (id, payload) => {
  const meter = await repository.findMeterById(id);
  if (!meter) throw new ApiError(404, 'Meter not found');
  return repository.updateMeter(id, payload);
};

const deleteMeter = async (id) => {
  const meter = await repository.findMeterById(id);
  if (!meter) throw new ApiError(404, 'Meter not found');
  const deleted = await repository.deleteMeter(id);
  if (!deleted) throw new ApiError(400, 'Meter could not be deleted (it may still have readings attached)');
  return deleted;
};

/**
 * "Meter replacement and transfer history" (spec bullet). No dedicated
 * history table exists in the 4 documented tables, so this is
 * implemented the lightweight way the schema actually supports: mark
 * the old meter REPLACED and create a brand new meter row for the same
 * unit/utility type - the old row itself (kept, never deleted) IS the
 * history, not a separate audit log.
 */
const replaceMeter = async (oldMeterId, { newMeterNo, installationDate }) => {
  const oldMeter = await repository.findMeterById(oldMeterId);
  if (!oldMeter) throw new ApiError(404, 'Meter not found');
  if (oldMeter.status === 'REPLACED') throw new ApiError(400, 'This meter has already been replaced');

  const newMeter = await repository.createMeter({
    societyId: oldMeter.society_id,
    unitId: oldMeter.unit_id,
    meterNo: newMeterNo,
    utilityTypeId: oldMeter.utility_type_id,
    installationDate,
  });
  await repository.updateMeter(oldMeterId, { status: 'REPLACED' });

  return { oldMeter: { ...oldMeter, status: 'REPLACED' }, newMeter };
};

// --- tariffs --------------------------------------------------------------------------

const createTariff = async (payload) => {
  const type = await repository.findTypeById(payload.utilityTypeId);
  if (!type) throw new ApiError(404, 'Utility type not found');
  return repository.createTariff(payload);
};

const listTariffs = async (utilityTypeId) => {
  const type = await repository.findTypeById(utilityTypeId);
  if (!type) throw new ApiError(404, 'Utility type not found');
  return repository.listTariffs(utilityTypeId);
};

const updateTariff = async (id, payload) => {
  const tariff = await repository.findTariffById(id);
  if (!tariff) throw new ApiError(404, 'Tariff not found');
  return repository.updateTariff(id, payload);
};

const deleteTariff = async (id) => {
  const tariff = await repository.findTariffById(id);
  if (!tariff) throw new ApiError(404, 'Tariff not found');
  return repository.deleteTariff(id);
};

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
