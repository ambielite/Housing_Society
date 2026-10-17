const db = require('../../config/db');

// --- utility_types --------------------------------------------------------------

const createType = async ({ societyId, code, name, unitOfMeasure }) => {
  const result = await db.query(
    `INSERT INTO utility_types (society_id, code, name, unit_of_measure)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [societyId, code, name, unitOfMeasure]
  );
  return result.rows[0];
};

const findTypeById = async (id) => {
  const result = await db.query('SELECT * FROM utility_types WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listTypes = async ({ societyId, status }) => {
  const conditions = [];
  const params = [];
  let idx = 1;
  if (societyId) {
    conditions.push(`society_id = $${idx++}`);
    params.push(societyId);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(`SELECT * FROM utility_types ${whereClause} ORDER BY name ASC`, params);
  return result.rows;
};

const updateType = async (id, { name, unitOfMeasure, status }) => {
  const result = await db.query(
    `UPDATE utility_types SET
       name             = COALESCE($2, name),
       unit_of_measure  = COALESCE($3, unit_of_measure),
       status           = COALESCE($4, status),
       updated_at       = now()
     WHERE id = $1
     RETURNING *`,
    [id, name, unitOfMeasure, status]
  );
  return result.rows[0] || null;
};

const deleteType = async (id) => {
  const result = await db.query('DELETE FROM utility_types WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

// --- meters ---------------------------------------------------------------------

const createMeter = async ({ societyId, unitId, meterNo, utilityTypeId, installationDate }) => {
  const result = await db.query(
    `INSERT INTO meters (society_id, unit_id, meter_no, utility_type_id, installation_date)
     VALUES ($1, $2, $3, $4, $5::date)
     RETURNING *`,
    [societyId, unitId || null, meterNo, utilityTypeId, installationDate || null]
  );
  return result.rows[0];
};

const findMeterById = async (id) => {
  const result = await db.query('SELECT * FROM meters WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listMeters = async ({ societyId, unitId, utilityTypeId, status }) => {
  const conditions = [];
  const params = [];
  let idx = 1;
  if (societyId) {
    conditions.push(`society_id = $${idx++}`);
    params.push(societyId);
  }
  if (unitId) {
    conditions.push(`unit_id = $${idx++}`);
    params.push(unitId);
  }
  if (utilityTypeId) {
    conditions.push(`utility_type_id = $${idx++}`);
    params.push(utilityTypeId);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(`SELECT * FROM meters ${whereClause} ORDER BY created_at DESC`, params);
  return result.rows;
};

const updateMeter = async (id, { unitId, meterNo, installationDate, status }) => {
  const result = await db.query(
    `UPDATE meters SET
       unit_id            = COALESCE($2, unit_id),
       meter_no           = COALESCE($3, meter_no),
       installation_date  = COALESCE($4::date, installation_date),
       status             = COALESCE($5, status),
       updated_at         = now()
     WHERE id = $1
     RETURNING *`,
    [id, unitId, meterNo, installationDate, status]
  );
  return result.rows[0] || null;
};

const deleteMeter = async (id) => {
  const result = await db.query('DELETE FROM meters WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

// --- utility_tariffs --------------------------------------------------------------

const createTariff = async ({ societyId, utilityTypeId, slabConfig, effectiveFrom, effectiveTo }) => {
  const result = await db.query(
    `INSERT INTO utility_tariffs (society_id, utility_type_id, slab_config, effective_from, effective_to)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [societyId, utilityTypeId, slabConfig, effectiveFrom, effectiveTo || null]
  );
  return result.rows[0];
};

const findTariffById = async (id) => {
  const result = await db.query('SELECT * FROM utility_tariffs WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listTariffs = async (utilityTypeId) => {
  const result = await db.query(
    'SELECT * FROM utility_tariffs WHERE utility_type_id = $1 ORDER BY effective_from DESC',
    [utilityTypeId]
  );
  return result.rows;
};

/** Resolves the tariff active for a given utility type on a given date. */
const findApplicableTariff = async (utilityTypeId, onDate) => {
  const result = await db.query(
    `SELECT * FROM utility_tariffs
     WHERE utility_type_id = $1
       AND effective_from <= $2
       AND (effective_to IS NULL OR effective_to >= $2)
     ORDER BY effective_from DESC
     LIMIT 1`,
    [utilityTypeId, onDate]
  );
  return result.rows[0] || null;
};

const updateTariff = async (id, { slabConfig, effectiveFrom, effectiveTo }) => {
  const result = await db.query(
    `UPDATE utility_tariffs SET
       slab_config      = COALESCE($2, slab_config),
       effective_from   = COALESCE($3, effective_from),
       effective_to     = COALESCE($4, effective_to)
     WHERE id = $1
     RETURNING *`,
    [id, slabConfig, effectiveFrom, effectiveTo]
  );
  return result.rows[0] || null;
};

const deleteTariff = async (id) => {
  const result = await db.query('DELETE FROM utility_tariffs WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

module.exports = {
  createType,
  findTypeById,
  listTypes,
  updateType,
  deleteType,
  createMeter,
  findMeterById,
  listMeters,
  updateMeter,
  deleteMeter,
  createTariff,
  findTariffById,
  listTariffs,
  findApplicableTariff,
  updateTariff,
  deleteTariff,
};
