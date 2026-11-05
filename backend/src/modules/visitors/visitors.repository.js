const db = require('../../config/db');

// --- visitor_profiles --------------------------------------------------------

const createProfile = async ({ societyId, name, visitorType, deliveryCompany, phone, idType, idNumberMasked, vehicleNo, photoDocumentId }) => {
  const result = await db.query(
    `INSERT INTO visitor_profiles (society_id, name, visitor_type, delivery_company, phone, id_type, id_number_masked, vehicle_no, photo_document_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [societyId, name, visitorType || 'GUEST', visitorType === 'DELIVERY_PERSON' ? deliveryCompany || null : null, phone || null, idType || null, idNumberMasked || null, vehicleNo || null, photoDocumentId || null]
  );
  return result.rows[0];
};

const findProfileById = async (id) => {
  const result = await db.query('SELECT * FROM visitor_profiles WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listProfiles = async ({ societyId, search, blacklistStatus }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (societyId) {
    conditions.push(`society_id = $${idx++}`);
    params.push(societyId);
  }
  if (search) {
    conditions.push(`(name ILIKE $${idx} OR phone ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx += 1;
  }
  if (blacklistStatus) {
    conditions.push(`blacklist_status = $${idx++}`);
    params.push(blacklistStatus);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT * FROM visitor_profiles ${whereClause} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
};

const listDestinations = async (societyId) => {
  const result = await db.query(
    `WITH resident_units AS (
       SELECT ou.unit_id, ou.owner_id AS resident_id
       FROM owner_units ou
       WHERE ou.society_id = $1 AND ou.status = 'ACTIVE'
         AND ou.effective_from <= CURRENT_DATE
         AND (ou.effective_to IS NULL OR ou.effective_to >= CURRENT_DATE)
       UNION
       SELECT o.unit_id, o.resident_id
       FROM occupancies o
       WHERE o.society_id = $1 AND COALESCE(o.is_current, true) = true
         AND (o.end_date IS NULL OR o.end_date >= CURRENT_DATE)
     )
     SELECT DISTINCT u.id AS unit_id, u.unit_number,
            t.name AS tower_name, f.name AS floor_name,
            r.id AS resident_id,
            COALESCE(NULLIF(r.display_name, ''), concat_ws(' ', r.first_name, r.last_name)) AS resident_name
     FROM resident_units ru
     JOIN units u ON u.id = ru.unit_id
     JOIN floors f ON f.id = u.floor_id
     JOIN towers t ON t.id = f.tower_id AND t.society_id = $1
     JOIN residents r ON r.id = ru.resident_id AND r.society_id = $1
     WHERE r.status = 'ACTIVE'
     ORDER BY t.name, f.name, u.unit_number, resident_name`,
    [societyId]
  );
  return result.rows;
};

const destinationBelongsToSociety = async ({ societyId, unitId, residentId }) => {
  const result = await db.query(
    `SELECT 1
     FROM owner_units ou
     JOIN residents r ON r.id = ou.owner_id AND r.society_id = $1
     JOIN units u ON u.id = ou.unit_id
     JOIN floors f ON f.id = u.floor_id
     JOIN towers t ON t.id = f.tower_id AND t.society_id = $1
     WHERE ou.society_id = $1 AND ou.unit_id = $2 AND ou.owner_id = $3
       AND ou.status = 'ACTIVE' AND ou.effective_from <= CURRENT_DATE
       AND (ou.effective_to IS NULL OR ou.effective_to >= CURRENT_DATE)
       AND r.status = 'ACTIVE'
     UNION
     SELECT 1
     FROM occupancies o
     JOIN residents r ON r.id = o.resident_id AND r.society_id = $1
     JOIN units u ON u.id = o.unit_id
     JOIN floors f ON f.id = u.floor_id
     JOIN towers t ON t.id = f.tower_id AND t.society_id = $1
     WHERE o.society_id = $1 AND o.unit_id = $2 AND o.resident_id = $3
       AND COALESCE(o.is_current, true) = true
       AND (o.end_date IS NULL OR o.end_date >= CURRENT_DATE)
       AND r.status = 'ACTIVE'
     LIMIT 1`,
    [societyId, unitId, residentId]
  );
  return result.rowCount > 0;
};

const updateProfile = async (id, { name, phone, idType, idNumberMasked, vehicleNo, visitorType, deliveryCompany }) => {
  const result = await db.query(
    `UPDATE visitor_profiles SET
       name              = COALESCE($2, name),
       phone             = COALESCE($3, phone),
       id_type           = COALESCE($4, id_type),
       id_number_masked  = COALESCE($5, id_number_masked),
       vehicle_no        = COALESCE($6, vehicle_no),
       visitor_type      = COALESCE($7, visitor_type),
       delivery_company  = CASE
         WHEN $7 IS NULL THEN COALESCE(NULLIF($8, ''), delivery_company)
         WHEN $7 = 'DELIVERY_PERSON' THEN NULLIF($8, '')
         ELSE NULL
       END,
       updated_at        = now()
     WHERE id = $1
     RETURNING *`,
    [id, name, phone, idType, idNumberMasked, vehicleNo, visitorType, deliveryCompany]
  );
  return result.rows[0] || null;
};

const updateBlacklistStatus = async (id, blacklistStatus) => {
  const result = await db.query(
    'UPDATE visitor_profiles SET blacklist_status = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [id, blacklistStatus]
  );
  return result.rows[0] || null;
};

// --- visitor_invites --------------------------------------------------------

const createInvite = async ({ societyId, invitedBy, unitId, visitorProfileId, expectedFrom, expectedUntil, purpose }) => {
  const result = await db.query(
    `INSERT INTO visitor_invites (society_id, invited_by, unit_id, visitor_profile_id, expected_from, expected_until, purpose)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [societyId, invitedBy, unitId, visitorProfileId, expectedFrom, expectedUntil || null, purpose || null]
  );
  return result.rows[0];
};

const findInviteById = async (id) => {
  const result = await db.query('SELECT * FROM visitor_invites WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listInvites = async ({ societyId, unitId, status }) => {
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
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT * FROM visitor_invites ${whereClause} ORDER BY expected_from DESC`,
    params
  );
  return result.rows;
};

const updateInviteStatus = async (id, status) => {
  const result = await db.query(
    'UPDATE visitor_invites SET status = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [id, status]
  );
  return result.rows[0] || null;
};

// --- visitor_passes --------------------------------------------------------------

const createPass = async ({ inviteId, visitorProfileId, gateId, passNo, unitId, residentId }) => {
  const result = await db.query(
    `INSERT INTO visitor_passes (invite_id, visitor_profile_id, gate_id, pass_no, unit_id, resident_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [inviteId || null, visitorProfileId, gateId, passNo, unitId || null, residentId || null]
  );
  return result.rows[0];
};

const findPassById = async (id) => {
  const result = await db.query('SELECT * FROM visitor_passes WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listPasses = async ({ gateId, visitorProfileId, status }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (gateId) {
    conditions.push(`gate_id = $${idx++}`);
    params.push(gateId);
  }
  if (visitorProfileId) {
    conditions.push(`visitor_profile_id = $${idx++}`);
    params.push(visitorProfileId);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT * FROM visitor_passes ${whereClause} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
};

const updatePassStatus = async (id, status) => {
  const result = await db.query(
    'UPDATE visitor_passes SET status = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [id, status]
  );
  return result.rows[0] || null;
};

// --- gate_events --------------------------------------------------------------------

const createGateEvent = async ({ societyId, gateId, visitorPassId, vehicleId, eventType, capturedBy, deviceEventId }) => {
  const result = await db.query(
    `INSERT INTO gate_events (society_id, gate_id, visitor_pass_id, vehicle_id, event_type, captured_by, device_event_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [societyId, gateId, visitorPassId || null, vehicleId || null, eventType, capturedBy || null, deviceEventId || null]
  );
  return result.rows[0];
};

const listGateEvents = async ({ societyId, gateId, visitorPassId }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (societyId) {
    conditions.push(`society_id = $${idx++}`);
    params.push(societyId);
  }
  if (gateId) {
    conditions.push(`gate_id = $${idx++}`);
    params.push(gateId);
  }
  if (visitorPassId) {
    conditions.push(`visitor_pass_id = $${idx++}`);
    params.push(visitorPassId);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT * FROM gate_events ${whereClause} ORDER BY event_at DESC LIMIT 200`,
    params
  );
  return result.rows;
};

// --- overstay_alerts -----------------------------------------------------------------

const createOverstayAlert = async ({ visitorPassId, durationMinutes }) => {
  const result = await db.query(
    `INSERT INTO overstay_alerts (visitor_pass_id, duration_minutes)
     VALUES ($1, $2)
     RETURNING *`,
    [visitorPassId, durationMinutes]
  );
  return result.rows[0];
};

const findOverstayAlertById = async (id) => {
  const result = await db.query('SELECT * FROM overstay_alerts WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listOverstayAlerts = async ({ status }) => {
  const conditions = [];
  const params = [];
  if (status) {
    conditions.push('status = $1');
    params.push(status);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT * FROM overstay_alerts ${whereClause} ORDER BY triggered_at DESC`,
    params
  );
  return result.rows;
};

const acknowledgeOverstayAlert = async (id, acknowledgedBy, status) => {
  const result = await db.query(
    `UPDATE overstay_alerts SET status = $2, acknowledged_by = $3 WHERE id = $1 RETURNING *`,
    [id, status, acknowledgedBy]
  );
  return result.rows[0] || null;
};

module.exports = {
  createProfile,
  listDestinations,
  destinationBelongsToSociety,
  findProfileById,
  listProfiles,
  updateProfile,
  updateBlacklistStatus,
  createInvite,
  findInviteById,
  listInvites,
  updateInviteStatus,
  createPass,
  findPassById,
  listPasses,
  updatePassStatus,
  createGateEvent,
  listGateEvents,
  createOverstayAlert,
  findOverstayAlertById,
  listOverstayAlerts,
  acknowledgeOverstayAlert,
};
