const db = require('../../config/db');

// --- vehicles -------------------------------------------------------------

const findByRegistration = async (societyId, registrationNo) => {
  const result = await db.query(
    'SELECT * FROM vehicles WHERE society_id = $1 AND registration_no = $2',
    [societyId, registrationNo]
  );
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await db.query('SELECT * FROM vehicles WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const createVehicle = async ({ societyId, ownerUserId, unitId, registrationNo, vehicleType, make, model, color }) => {
  const result = await db.query(
    `INSERT INTO vehicles (society_id, owner_user_id, unit_id, registration_no, vehicle_type, make, model, color)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [societyId, ownerUserId || null, unitId || null, registrationNo, vehicleType, make || null, model || null, color || null]
  );
  return result.rows[0];
};

const listVehicles = async ({ societyId, unitId, ownerUserId, status, limit, offset }) => {
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
  if (ownerUserId) {
    conditions.push(`owner_user_id = $${idx++}`);
    params.push(ownerUserId);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const dataResult = await db.query(
    `SELECT * FROM vehicles ${whereClause} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );
  const countResult = await db.query(`SELECT COUNT(*)::int AS total FROM vehicles ${whereClause}`, params);

  return { rows: dataResult.rows, total: countResult.rows[0].total };
};

const updateVehicle = async (id, { ownerUserId, unitId, make, model, color }) => {
  const result = await db.query(
    `UPDATE vehicles SET
       owner_user_id = COALESCE($2, owner_user_id),
       unit_id       = COALESCE($3, unit_id),
       make          = COALESCE($4, make),
       model         = COALESCE($5, model),
       color         = COALESCE($6, color),
       updated_at    = now()
     WHERE id = $1
     RETURNING *`,
    [id, ownerUserId, unitId, make, model, color]
  );
  return result.rows[0] || null;
};

const updateVehicleStatus = async (id, status) => {
  const result = await db.query(
    'UPDATE vehicles SET status = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [id, status]
  );
  return result.rows[0] || null;
};

// --- vehicle_access_credentials ---------------------------------------------

const findCredentialByValue = async (credentialValue) => {
  const result = await db.query(
    'SELECT * FROM vehicle_access_credentials WHERE credential_value = $1',
    [credentialValue]
  );
  return result.rows[0] || null;
};

const createCredential = async ({ vehicleId, credentialType, credentialValue, expiresAt }) => {
  const result = await db.query(
    `INSERT INTO vehicle_access_credentials (vehicle_id, credential_type, credential_value, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [vehicleId, credentialType, credentialValue, expiresAt || null]
  );
  return result.rows[0];
};

const listCredentialsForVehicle = async (vehicleId) => {
  const result = await db.query(
    'SELECT * FROM vehicle_access_credentials WHERE vehicle_id = $1 ORDER BY issued_at DESC',
    [vehicleId]
  );
  return result.rows;
};

const findCredentialById = async (id) => {
  const result = await db.query('SELECT * FROM vehicle_access_credentials WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const revokeCredential = async (id) => {
  const result = await db.query(
    `UPDATE vehicle_access_credentials SET status = 'REVOKED' WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

// --- parking_visits ----------------------------------------------------------

const createVisit = async ({ societyId, vehicleId, visitorId, slotId }) => {
  const result = await db.query(
    `INSERT INTO parking_visits (society_id, vehicle_id, visitor_id, slot_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [societyId, vehicleId || null, visitorId || null, slotId]
  );
  return result.rows[0];
};

const findVisitById = async (id) => {
  const result = await db.query('SELECT * FROM parking_visits WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const findOpenVisitForSlot = async (slotId) => {
  const result = await db.query(
    `SELECT * FROM parking_visits WHERE slot_id = $1 AND status = 'INSIDE'`,
    [slotId]
  );
  return result.rows[0] || null;
};

const listVisits = async ({ societyId, slotId, vehicleId, status }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (societyId) {
    conditions.push(`society_id = $${idx++}`);
    params.push(societyId);
  }
  if (slotId) {
    conditions.push(`slot_id = $${idx++}`);
    params.push(slotId);
  }
  if (vehicleId) {
    conditions.push(`vehicle_id = $${idx++}`);
    params.push(vehicleId);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT * FROM parking_visits ${whereClause} ORDER BY entry_at DESC`,
    params
  );
  return result.rows;
};

const closeVisit = async (id, status) => {
  const result = await db.query(
    `UPDATE parking_visits SET status = $2, exit_at = now() WHERE id = $1 RETURNING *`,
    [id, status]
  );
  return result.rows[0] || null;
};

module.exports = {
  findByRegistration,
  findById,
  createVehicle,
  listVehicles,
  updateVehicle,
  updateVehicleStatus,
  findCredentialByValue,
  createCredential,
  listCredentialsForVehicle,
  findCredentialById,
  revokeCredential,
  createVisit,
  findVisitById,
  findOpenVisitForSlot,
  listVisits,
  closeVisit,
};
