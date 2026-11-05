const db = require('../../config/db');

const getCurrentDate = async () => {
  const result = await db.query('SELECT CURRENT_DATE::text AS today');
  return result.rows[0].today;
};

const unitBelongsToSociety = async (unitId, societyId) => {
  // Unit ownership is defined by the society -> tower -> floor -> unit
  // hierarchy. `units.society_id` is a legacy denormalized field and can be
  // empty for units created through the existing unit management flow.
  const result = await db.query(
    `SELECT 1
     FROM units u
     JOIN floors f ON f.id = u.floor_id
     JOIN towers t ON t.id = f.tower_id
     WHERE u.id = $1 AND t.society_id = $2
     LIMIT 1`,
    [unitId, societyId]
  );
  return result.rowCount > 0;
};

// --- amenities ----------------------------------------------------------------

const createAmenity = async ({ societyId, name, amenityType, capacity, location, bookingRequired }) => {
  const result = await db.query(
    `INSERT INTO amenities (society_id, name, amenity_type, capacity, location, booking_required)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, true))
     RETURNING *`,
    [societyId, name, amenityType, capacity || null, location || null, bookingRequired]
  );
  return result.rows[0];
};

const findAmenityById = async (id) => {
  const result = await db.query('SELECT * FROM amenities WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listAmenities = async ({ societyId, status }) => {
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
  const result = await db.query(
    `SELECT * FROM amenities ${whereClause} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
};

const updateAmenity = async (id, { name, amenityType, capacity, location, bookingRequired, status }) => {
  const result = await db.query(
    `UPDATE amenities SET
       name              = COALESCE($2, name),
       amenity_type      = COALESCE($3, amenity_type),
       capacity          = COALESCE($4, capacity),
       location          = COALESCE($5, location),
       booking_required  = COALESCE($6, booking_required),
       status            = COALESCE($7, status),
       updated_at        = now()
     WHERE id = $1
     RETURNING *`,
    [id, name, amenityType, capacity, location, bookingRequired, status]
  );
  return result.rows[0] || null;
};

const deleteAmenity = async (id) => {
  const result = await db.query('DELETE FROM amenities WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

// --- amenity_slots --------------------------------------------------------------

const createSlot = async ({ amenityId, slotDate, startTime, endTime, capacity, price }) => {
  const result = await db.query(
    `INSERT INTO amenity_slots (amenity_id, slot_date, start_time, end_time, capacity, price)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, 0))
     RETURNING *`,
    [amenityId, slotDate, startTime, endTime, capacity, price]
  );
  return result.rows[0];
};

const createSlotSeries = async ({ amenityId, dates, startTime, endTime, capacity, price }) => {
  const values = [];
  const rows = dates.map((date, index) => {
    const offset = index * 6;
    values.push(amenityId, date, startTime, endTime, capacity, price);
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, COALESCE($${offset + 6}, 0))`;
  });
  const result = await db.query(
    `INSERT INTO amenity_slots (amenity_id, slot_date, start_time, end_time, capacity, price)
     VALUES ${rows.join(', ')}
     RETURNING *`,
    values
  );
  return result.rows;
};

const findSlotById = async (id) => {
  const result = await db.query('SELECT * FROM amenity_slots WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/** Row-level lock used by the booking service to prevent double booking. */
const findSlotByIdForUpdate = async (client, id) => {
  const result = await client.query('SELECT * FROM amenity_slots WHERE id = $1 FOR UPDATE', [id]);
  return result.rows[0] || null;
};

const listSlots = async ({ amenityId, slotDate, status }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (amenityId) {
    conditions.push(`amenity_id = $${idx++}`);
    params.push(amenityId);
  }
  if (slotDate) {
    conditions.push(`slot_date = $${idx++}`);
    params.push(slotDate);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT amenity_slots.*,
            COALESCE(slot_occupancy.current_occupancy, 0)::int AS current_occupancy
       FROM amenity_slots
       LEFT JOIN LATERAL (
         SELECT SUM(b.guests_count + 1)::int AS current_occupancy
           FROM amenity_bookings b
          WHERE b.amenity_slot_id = amenity_slots.id
            AND (b.status = 'CONFIRMED'
              OR (b.status = 'PENDING_PAYMENT'
                  AND b.created_at >= now() - interval '5 minutes'))
       ) slot_occupancy ON TRUE
       ${whereClause}
      ORDER BY slot_date ASC, start_time ASC`,
    params
  );
  return result.rows;
};

const updateSlot = async (id, { startTime, endTime, capacity, price, status }) => {
  const result = await db.query(
    `UPDATE amenity_slots SET
       start_time  = COALESCE($2, start_time),
       end_time    = COALESCE($3, end_time),
       capacity    = COALESCE($4, capacity),
       price       = COALESCE($5, price),
       status      = COALESCE($6, status),
       updated_at  = now()
     WHERE id = $1
     RETURNING *`,
    [id, startTime, endTime, capacity, price, status]
  );
  return result.rows[0] || null;
};

const updateSlotStatusInTx = async (client, id, status) => {
  const result = await client.query(
    'UPDATE amenity_slots SET status = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [id, status]
  );
  return result.rows[0] || null;
};

const deleteSlot = async (id) => {
  const result = await db.query('DELETE FROM amenity_slots WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

// --- amenity_pricing_rules -------------------------------------------------------

const createPricingRule = async ({ amenityId, memberType, dayType, price, effectiveFrom, effectiveTo }) => {
  const result = await db.query(
    `INSERT INTO amenity_pricing_rules (amenity_id, member_type, day_type, price, effective_from, effective_to)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [amenityId, memberType, dayType, price, effectiveFrom, effectiveTo || null]
  );
  return result.rows[0];
};

const findPricingRuleById = async (id) => {
  const result = await db.query('SELECT * FROM amenity_pricing_rules WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listPricingRules = async (amenityId) => {
  const result = await db.query(
    'SELECT * FROM amenity_pricing_rules WHERE amenity_id = $1 ORDER BY effective_from DESC',
    [amenityId]
  );
  return result.rows;
};

/** Resolves the applicable price for a given amenity/member/day-type/date. */
const findApplicablePricingRule = async (amenityId, memberType, dayType, onDate) => {
  const result = await db.query(
    `SELECT * FROM amenity_pricing_rules
     WHERE amenity_id = $1 AND member_type = $2 AND day_type = $3
       AND effective_from <= $4
       AND (effective_to IS NULL OR effective_to >= $4)
     ORDER BY effective_from DESC
     LIMIT 1`,
    [amenityId, memberType, dayType, onDate]
  );
  return result.rows[0] || null;
};

const updatePricingRule = async (id, { price, effectiveFrom, effectiveTo }) => {
  const result = await db.query(
    `UPDATE amenity_pricing_rules SET
       price           = COALESCE($2, price),
       effective_from  = COALESCE($3, effective_from),
       effective_to    = COALESCE($4, effective_to)
     WHERE id = $1
     RETURNING *`,
    [id, price, effectiveFrom, effectiveTo]
  );
  return result.rows[0] || null;
};

const deletePricingRule = async (id) => {
  const result = await db.query('DELETE FROM amenity_pricing_rules WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

// --- amenity_blockouts ------------------------------------------------------------

const createBlockout = async ({ amenityId, startAt, endAt, reason, createdBy }) => {
  const result = await db.query(
    `INSERT INTO amenity_blockouts (amenity_id, start_at, end_at, reason, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [amenityId, startAt, endAt, reason || null, createdBy || null]
  );
  return result.rows[0];
};

const findBlockoutById = async (id) => {
  const result = await db.query('SELECT * FROM amenity_blockouts WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listBlockouts = async (amenityId) => {
  const result = await db.query(
    'SELECT * FROM amenity_blockouts WHERE amenity_id = $1 ORDER BY start_at DESC',
    [amenityId]
  );
  return result.rows;
};

/** Checks whether a given timestamp range overlaps any blockout for the amenity. */
const findOverlappingBlockout = async (amenityId, startAt, endAt) => {
  const result = await db.query(
    `SELECT * FROM amenity_blockouts
     WHERE amenity_id = $1 AND start_at < $3 AND end_at > $2
     LIMIT 1`,
    [amenityId, startAt, endAt]
  );
  return result.rows[0] || null;
};

const deleteBlockout = async (id) => {
  const result = await db.query('DELETE FROM amenity_blockouts WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

module.exports = {
  getCurrentDate,
  unitBelongsToSociety,
  createAmenity,
  findAmenityById,
  listAmenities,
  updateAmenity,
  deleteAmenity,
  createSlot,
  createSlotSeries,
  findSlotById,
  findSlotByIdForUpdate,
  listSlots,
  updateSlot,
  updateSlotStatusInTx,
  deleteSlot,
  createPricingRule,
  findPricingRuleById,
  listPricingRules,
  findApplicablePricingRule,
  updatePricingRule,
  deletePricingRule,
  createBlockout,
  findBlockoutById,
  listBlockouts,
  findOverlappingBlockout,
  deleteBlockout,
};
