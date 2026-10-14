const db = require('../../config/db');

// --- gates ------------------------------------------------------------------

const createGate = async ({ societyId, name, location, gateType }) => {
  const result = await db.query(
    `INSERT INTO gates (society_id, name, location, gate_type)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [societyId, name, location || null, gateType]
  );
  return result.rows[0];
};

const findGateById = async (id) => {
  const result = await db.query('SELECT * FROM gates WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listGates = async (societyId) => {
  const result = await db.query(
    'SELECT * FROM gates WHERE society_id = $1 ORDER BY created_at DESC',
    [societyId]
  );
  return result.rows;
};

const updateGate = async (id, { name, location, gateType, status }) => {
  const result = await db.query(
    `UPDATE gates SET
       name       = COALESCE($2, name),
       location   = COALESCE($3, location),
       gate_type  = COALESCE($4, gate_type),
       status     = COALESCE($5, status),
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, name, location, gateType, status]
  );
  return result.rows[0] || null;
};

const deleteGate = async (id) => {
  const result = await db.query('DELETE FROM gates WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

// --- security_guards --------------------------------------------------------

const createGuard = async ({ userId, employeeCode, agencyVendorId }) => {
  const result = await db.query(
    `INSERT INTO security_guards (user_id, employee_code, agency_vendor_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, employeeCode || null, agencyVendorId || null]
  );
  return result.rows[0];
};

// const findGuardById = async (id) => {  // old one
//   const result = await db.query('SELECT * FROM security_guards WHERE id = $1', [id]);
//   return result.rows[0] || null;
// };

const findGuardById = async (id) => {
  const result = await db.query(
    `SELECT
       sg.*,
       u.first_name AS user_first_name,
       u.last_name AS user_last_name,
       u.email AS user_email,
       v.legal_name AS agency_vendor_name
     FROM security_guards sg
     LEFT JOIN users u ON u.id = sg.user_id
     LEFT JOIN vendors v ON v.id = sg.agency_vendor_id
     WHERE sg.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const listGuards = async ({ agencyVendorId, status }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (agencyVendorId) {
    conditions.push(`agency_vendor_id = $${idx++}`);
    params.push(agencyVendorId);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  // const result = await db.query(  // old one 
  //   `SELECT * FROM security_guards ${whereClause} ORDER BY created_at DESC`,
  //   params
  // );

  const result = await db.query(
  `SELECT
     sg.*,
     u.first_name AS user_first_name,
     u.last_name AS user_last_name,
     u.email AS user_email,
     v.legal_name AS agency_vendor_name
   FROM security_guards sg
   LEFT JOIN users u ON u.id = sg.user_id
   LEFT JOIN vendors v ON v.id = sg.agency_vendor_id
   ${whereClause ? `WHERE ${whereClause
     .replaceAll('agency_vendor_id', 'sg.agency_vendor_id')
     .replaceAll('status', 'sg.status')}` : ''}
   ORDER BY sg.created_at DESC`,
  params
);
  return result.rows;
};

const updateGuard = async (id, { employeeCode, agencyVendorId, status }) => {
  const result = await db.query(
    `UPDATE security_guards SET
       employee_code     = COALESCE($2, employee_code),
       agency_vendor_id  = COALESCE($3, agency_vendor_id),
       status            = COALESCE($4, status),
       updated_at        = now()
     WHERE id = $1
     RETURNING *`,
    [id, employeeCode, agencyVendorId, status]
  );
  return result.rows[0] || null;
};

const deleteGuard = async (id) => {
  const result = await db.query('DELETE FROM security_guards WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
};

// --- access_cards -------------------------------------------------------------

const createAccessCard = async ({ societyId, holderUserId, credentialNo, credentialType, validUntil }) => {
  const result = await db.query(
    `INSERT INTO access_cards (society_id, holder_user_id, credential_no, credential_type, valid_until)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [societyId, holderUserId, credentialNo, credentialType, validUntil || null]
  );
  return result.rows[0];
};

const findAccessCardById = async (id) => {
  const result = await db.query(
    'SELECT * FROM access_cards WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};


const findAccessCardByNo = async (credentialNo) => {
  const result = await db.query('SELECT * FROM access_cards WHERE credential_no = $1', [credentialNo]);
  return result.rows[0] || null;
};

const listAccessCards = async ({ societyId, holderUserId, status }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (societyId) {
    conditions.push(`society_id = $${idx++}`);
    params.push(societyId);
  }

  if (holderUserId) {
    conditions.push(`holder_user_id = $${idx++}`);
    params.push(holderUserId);
  }

  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const result = await db.query(
    `SELECT * FROM access_cards ${whereClause} ORDER BY created_at DESC`,
    params
  );

  return result.rows;
};

const updateAccessCardStatus = async (id, status) => {
  const result = await db.query(
    'UPDATE access_cards SET status = $2 WHERE id = $1 RETURNING *',
    [id, status]
  );
  return result.rows[0] || null;
};

// --- gate_devices ------------------------------------------------------------

const createGateDevice = async ({ gateId, deviceType, serialNo, ipAddress }) => {
  const result = await db.query(
    `INSERT INTO gate_devices (gate_id, device_type, serial_no, ip_address)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [gateId, deviceType, serialNo, ipAddress || null]
  );
  return result.rows[0];
};

const findGateDeviceById = async (id) => {
  const result = await db.query('SELECT * FROM gate_devices WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listGateDevices = async (gateId) => {
  const result = await db.query(
    'SELECT * FROM gate_devices WHERE gate_id = $1 ORDER BY created_at DESC',
    [gateId]
  );
  return result.rows;
};

const updateGateDevice = async (id, { status, ipAddress, lastSeenAt }) => {
  const result = await db.query(
    `UPDATE gate_devices SET
       status        = COALESCE($2, status),
       ip_address    = COALESCE($3, ip_address),
       last_seen_at  = COALESCE($4, last_seen_at),
       updated_at    = now()
     WHERE id = $1
     RETURNING *`,
    [id, status, ipAddress, lastSeenAt]
  );
  return result.rows[0] || null;
};

// --- device_events --------------------------------------------------------------

const createDeviceEvent = async ({ gateDeviceId, externalEventId, eventType, payload }) => {
  const result = await db.query(
    `INSERT INTO device_events (gate_device_id, external_event_id, event_type, payload)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [gateDeviceId, externalEventId || null, eventType, payload || null]
  );

  // Update the device's heartbeat/status while we're here
  await db.query(
    `UPDATE gate_devices SET status = 'ONLINE', last_seen_at = now(), updated_at = now() WHERE id = $1`,
    [gateDeviceId]
  );

  return result.rows[0];
};

const findDeviceEventById = async (id) => {
  const result = await db.query('SELECT * FROM device_events WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listDeviceEvents = async (gateDeviceId) => {
  const result = await db.query(
    'SELECT * FROM device_events WHERE gate_device_id = $1 ORDER BY event_at DESC LIMIT 100',
    [gateDeviceId]
  );
  return result.rows;
};

module.exports = {
  createGate,
  findGateById,
  listGates,
  updateGate,
  deleteGate,
  createGuard,
  findGuardById,
  listGuards,
  updateGuard,
  deleteGuard,
  createAccessCard,
  findAccessCardById,
  findAccessCardByNo,
  listAccessCards,
  updateAccessCardStatus,
  createGateDevice,
  findGateDeviceById,
  listGateDevices,
  updateGateDevice,
  createDeviceEvent,
  findDeviceEventById,
  listDeviceEvents,
};
