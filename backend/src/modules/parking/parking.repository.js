const db = require('../../config/db');

// --- parking_areas ---------------------------------------------------------

const createArea = async ({ societyId, name, parkingType, zone }) => {
  const result = await db.query(
    `INSERT INTO parking_areas (society_id, name, parking_type, zone)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [societyId, name, parkingType, zone || null]
  );
  return result.rows[0];
};

const findAreaById = async (id) => {
  const result = await db.query('SELECT * FROM parking_areas WHERE id = $1', [id]);
  return result.rows[0] || null;
};



// NEW: finds an area in the same society with the same name (ignores upper/lower case and extra spaces),
// whether that area is active or inactive.
const findAreaByName = async (societyId, name) => {
  const result = await db.query(
    `SELECT * FROM parking_areas
     WHERE society_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2))`,
    [societyId, name]
  );
  return result.rows[0] || null;
};



const listAreas = async (societyId) => {
  const result = await db.query(
    'SELECT * FROM parking_areas WHERE society_id = $1 ORDER BY created_at DESC',
    [societyId]
  );
  return result.rows;
};

const updateArea = async (id, { name, parkingType, zone, status }) => {
  const result = await db.query(
    `UPDATE parking_areas SET
       name         = COALESCE($2, name),
       parking_type = COALESCE($3, parking_type),
       zone         = COALESCE($4, zone),
       status       = COALESCE($5, status),
       updated_at   = now()
     WHERE id = $1
     RETURNING *`,
    [id, name, parkingType, zone, status]
  );
  return result.rows[0] || null;
};

const deleteArea = async (id) => {
  const result = await db.query('DELETE FROM parking_areas WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

// --- parking_slots -----------------------------------------------------------

const createSlot = async ({ parkingAreaId, slotCode, slotType, vehicleType }) => {
  const result = await db.query(
    `INSERT INTO parking_slots (parking_area_id, slot_code, slot_type, vehicle_type)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [parkingAreaId, slotCode, slotType, vehicleType]
  );
  return result.rows[0];
};

const findSlotById = async (id) => {
  const result = await db.query('SELECT * FROM parking_slots WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listSlots = async ({ parkingAreaId, status }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (parkingAreaId) {
    conditions.push(`parking_area_id = $${idx++}`);
    params.push(parkingAreaId);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT * FROM parking_slots ${whereClause} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
};

const updateSlot = async (id, { slotCode, slotType, vehicleType, status }) => {
  const result = await db.query(
    `UPDATE parking_slots SET
       slot_code    = COALESCE($2, slot_code),
       slot_type    = COALESCE($3, slot_type),
       vehicle_type = COALESCE($4, vehicle_type),
       status       = COALESCE($5, status),
       updated_at   = now()
     WHERE id = $1
     RETURNING *`,
    [id, slotCode, slotType, vehicleType, status]
  );
  return result.rows[0] || null;
};

const deleteSlot = async (id) => {
  const result = await db.query('DELETE FROM parking_slots WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

// --- parking_allocations -------------------------------------------------------

const findActiveAllocationForSlot = async (slotId) => {
  const result = await db.query(
    `SELECT * FROM parking_allocations WHERE slot_id = $1 AND status = 'ACTIVE'`,
    [slotId]
  );
  return result.rows[0] || null;
};

const createAllocation = async ({ slotId, unitId, userId, allocationType, startDate, endDate, fee }) => {
  const result = await db.query(
    `INSERT INTO parking_allocations
       (slot_id, unit_id, user_id, allocation_type, start_date, end_date, fee)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [slotId, unitId || null, userId || null, allocationType, startDate, endDate || null, fee || null]
  );
  return result.rows[0];
};

const findAllocationById = async (id) => {
  const result = await db.query('SELECT * FROM parking_allocations WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listAllocations = async ({ slotId, unitId, status }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (slotId) {
    conditions.push(`slot_id = $${idx++}`);
    params.push(slotId);
  }
  if (unitId) {
    conditions.push(`unit_id = $${idx++}`);
    params.push(unitId);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT * FROM parking_allocations ${whereClause} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
};

const updateAllocationStatus = async (id, status, endDate) => {
  const result = await db.query(
    `UPDATE parking_allocations SET
       status     = $2,
       end_date   = COALESCE($3, end_date),
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, status, endDate || null]
  );
  return result.rows[0] || null;
};

const deleteAllocation = async (id) => {
  const result = await db.query('DELETE FROM parking_allocations WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

module.exports = {
  createArea,
  findAreaById,
  findAreaByName,   // new added function to find area by name
  listAreas,
  updateArea,
  deleteArea,
  createSlot,
  findSlotById,
  listSlots,
  updateSlot,
  deleteSlot,
  findActiveAllocationForSlot,
  createAllocation,
  findAllocationById,
  listAllocations,
  updateAllocationStatus,
  deleteAllocation,
};
