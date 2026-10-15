const db = require('../../config/db');

// --- deliveries --------------------------------------------------------------

const createDelivery = async ({ societyId, unitId, visitorProfileId, deliveryType, courierName, trackingNo }) => {
  const result = await db.query(
    `INSERT INTO deliveries (society_id, unit_id, visitor_profile_id, delivery_type, courier_name, tracking_no)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [societyId, unitId, visitorProfileId || null, deliveryType, courierName || null, trackingNo || null]
  );
  return result.rows[0];
};

const findDeliveryById = async (id) => {
  const result = await db.query('SELECT * FROM deliveries WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listDeliveries = async ({ societyId, unitId, status }) => {
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
    `SELECT * FROM deliveries ${whereClause} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
};

const updateDeliveryStatus = async (id, status, timestamps = {}) => {
  const result = await db.query(
    `UPDATE deliveries SET
       status          = $2,
       received_at     = COALESCE($3, received_at),
       handed_over_at   = COALESCE($4, handed_over_at),
       updated_at      = now()
     WHERE id = $1
     RETURNING *`,
    [id, status, timestamps.receivedAt || null, timestamps.handedOverAt || null]
  );
  return result.rows[0] || null;
};

// --- parcels ------------------------------------------------------------------

const createParcel = async ({ deliveryId, parcelCode, storageLocation, receivedBy }) => {
  const result = await db.query(
    `INSERT INTO parcels (delivery_id, parcel_code, storage_location, received_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [deliveryId, parcelCode || null, storageLocation || null, receivedBy || null]
  );
  return result.rows[0];
};

const findParcelById = async (id) => {
  const result = await db.query('SELECT * FROM parcels WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const listParcels = async ({ deliveryId, status }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (deliveryId) {
    conditions.push(`delivery_id = $${idx++}`);
    params.push(deliveryId);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(`SELECT * FROM parcels ${whereClause} ORDER BY id DESC`, params);
  return result.rows;
};

// const updateParcelStatus = async (id, status, collectedBy) => {
//   const result = await db.query(
//     `UPDATE parcels SET
//        status        = $2,
//        collected_by  = COALESCE($3, collected_by),
//        collected_at  = CASE WHEN $2 = 'COLLECTED' THEN now() ELSE collected_at END
//      WHERE id = $1
//      RETURNING *`,
//     [id, status, collectedBy || null]
//   );
//   return result.rows[0] || null;
// };


const updateParcelStatus = async (id, status, collectedBy) => {
  const isCollected = status === 'COLLECTED';

  const result = await db.query(
    `UPDATE parcels SET
       status        = $2,
       collected_by  = COALESCE($3, collected_by),
       collected_at  = CASE
                         WHEN $4 = true THEN now()
                         ELSE collected_at
                       END
     WHERE id = $1
     RETURNING *`,
    [id, status, collectedBy || null, isCollected]
  );

  return result.rows[0] || null;
};



module.exports = {
  createDelivery,
  findDeliveryById,
  listDeliveries,
  updateDeliveryStatus,
  createParcel,
  findParcelById,
  listParcels,
  updateParcelStatus,
};
