const db = require('../../config/db');

// --- meter_readings -------------------------------------------------------------

const createReading = async ({ meterId, readingDate, readingValue, source, capturedBy, imageDocumentId, status }) => {
  const result = await db.query(
    `INSERT INTO meter_readings (meter_id, reading_date, reading_value, source, captured_by, image_document_id, status)
     VALUES ($1, COALESCE($2, CURRENT_DATE), $3, COALESCE($4, 'MANUAL'), $5, $6, COALESCE($7, 'SUBMITTED'))
     RETURNING *`,
    [meterId, readingDate, readingValue, source, capturedBy || null, imageDocumentId || null, status]
  );
  return result.rows[0];
};

const findReadingById = async (id) => {
  const result = await db.query('SELECT * FROM meter_readings WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/** Most recent VALIDATED (or ESTIMATED, treated as a valid baseline) reading for a meter, before a given date. */
const findLastAcceptedReading = async (meterId, beforeDate, excludeReadingId = null) => {
  const result = await db.query(
    `SELECT * FROM meter_readings
     WHERE meter_id = $1 AND status IN ('VALIDATED', 'ESTIMATED', 'BILLED')
       AND reading_date <= $2
       AND ($3::uuid IS NULL OR id <> $3::uuid)
     ORDER BY reading_date DESC, created_at DESC
     LIMIT 1`,
    [meterId, beforeDate, excludeReadingId]
  );
  return result.rows[0] || null;
};

const listReadings = async ({ meterId, status }) => {
  const conditions = [];
  const params = [];
  let idx = 1;
  if (meterId) {
    conditions.push(`meter_id = $${idx++}`);
    params.push(meterId);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT * FROM meter_readings ${whereClause} ORDER BY reading_date DESC, created_at DESC`,
    params
  );
  return result.rows;
};

const updateReadingStatus = async (id, status) => {
  const result = await db.query(
    'UPDATE meter_readings SET status = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [id, status]
  );
  return result.rows[0] || null;
};

const adjustReading = async (id, { readingValue, status }) => {
  const result = await db.query(
    `UPDATE meter_readings SET
       reading_value  = COALESCE($2, reading_value),
       status         = COALESCE($3, status),
       updated_at     = now()
     WHERE id = $1
     RETURNING *`,
    [id, readingValue, status]
  );
  return result.rows[0] || null;
};

// --- utility_bills --------------------------------------------------------------------

const createBill = async ({ meterId, previousReading, currentReading, consumption, amount }) => {
  const result = await db.query(
    `INSERT INTO utility_bills (meter_id, previous_reading, current_reading, consumption, amount)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [meterId, previousReading, currentReading, consumption, amount]
  );
  return result.rows[0];
};

const findBillById = async (id) => {
  const result = await db.query('SELECT * FROM utility_bills WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listBillsForMeter = async (meterId) => {
  const result = await db.query(
    'SELECT * FROM utility_bills WHERE meter_id = $1 ORDER BY created_at DESC',
    [meterId]
  );
  return result.rows;
};

const linkBillToInvoice = async (id, { billingCycleId, invoiceLineId, status }) => {
  const result = await db.query(
    `UPDATE utility_bills SET
       billing_cycle_id  = COALESCE($2, billing_cycle_id),
       invoice_line_id   = COALESCE($3, invoice_line_id),
       status            = COALESCE($4, status),
       updated_at        = now()
     WHERE id = $1
     RETURNING *`,
    [id, billingCycleId, invoiceLineId, status]
  );
  return result.rows[0] || null;
};

module.exports = {
  createReading,
  findReadingById,
  findLastAcceptedReading,
  listReadings,
  updateReadingStatus,
  adjustReading,
  createBill,
  findBillById,
  listBillsForMeter,
  linkBillToInvoice,
};
