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

const notifyUnitResidents = async ({ societyId, unitId, title, message, referenceType, referenceId }) => {
  await db.query(
    `WITH target_residents AS (
       SELECT ou.owner_id AS resident_id
         FROM owner_units ou
        WHERE ou.society_id = $1 AND ou.unit_id = $2 AND ou.status = 'ACTIVE'
          AND ou.effective_from <= CURRENT_DATE
          AND (ou.effective_to IS NULL OR ou.effective_to >= CURRENT_DATE)
       UNION
       SELECT o.resident_id
         FROM occupancies o
        WHERE o.society_id = $1 AND o.unit_id = $2 AND COALESCE(o.is_current, true) = true
          AND (o.end_date IS NULL OR o.end_date >= CURRENT_DATE)
     )
     INSERT INTO notifications
       (society_id, user_id, channel, notification_type, title, subject, message,
        data, reference_type, reference_id, priority, status, delivered_at, created_at, updated_at)
     SELECT $1, r.user_id, 'IN_APP', 'OPERATIONAL', $3, $3, $4,
            jsonb_build_object('unitId', $2), $5, $6, 'MEDIUM', 'DELIVERED', now(), now(), now()
       FROM target_residents tr
       JOIN residents r ON r.id = tr.resident_id
      WHERE r.status = 'ACTIVE' AND r.user_id IS NOT NULL
     ON CONFLICT DO NOTHING`,
    [societyId, unitId, title, message, referenceType, referenceId],
  );
};

const listResidentNotifications = async (userId, societyId) => {
  const result = await db.query(
    `SELECT id, title, message, reference_type, reference_id, data, created_at
       FROM notifications
      WHERE user_id = $1 AND society_id = $2 AND channel = 'IN_APP'
        AND reference_type IN ('DELIVERY', 'PARCEL') AND is_read = false
      ORDER BY created_at DESC LIMIT 25`,
    [userId, societyId],
  );
  return result.rows;
};

const markResidentNotificationRead = async (id, userId, societyId) => {
  const result = await db.query(
    `UPDATE notifications SET is_read = true, read_at = now(), updated_at = now()
      WHERE id = $1 AND user_id = $2 AND society_id = $3
        AND reference_type IN ('DELIVERY', 'PARCEL') RETURNING id`,
    [id, userId, societyId],
  );
  return result.rows[0] || null;
};

const findDeliveryById = async (id) => {
  const result = await db.query(
    `SELECT d.*, vp.resident_decision
       FROM deliveries d
       LEFT JOIN visitor_passes vp ON vp.id = d.visitor_pass_id
      WHERE d.id = $1`,
    [id],
  );
  return result.rows[0] || null;
};

const linkVisitorPass = async (deliveryId, visitorPassId) => {
  const result = await db.query(
    'UPDATE deliveries SET visitor_pass_id = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [deliveryId, visitorPassId],
  );
  return result.rows[0] || null;
};

const syncStatusFromVisitorPass = async (visitorPassId, status) => {
  const result = await db.query(
    `UPDATE deliveries SET status = $2, updated_at = now()
      WHERE visitor_pass_id = $1 AND status IN ('EXPECTED', 'ARRIVED')
      RETURNING *`,
    [visitorPassId, status],
  );
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

const listParcels = async ({ societyId, deliveryId, status }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (societyId) {
    conditions.push(`d.society_id = $${idx++}`);
    params.push(societyId);
  }
  if (deliveryId) {
    conditions.push(`p.delivery_id = $${idx++}`);
    params.push(deliveryId);
  }
  if (status) {
    conditions.push(`p.status = $${idx++}`);
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT p.*
     FROM parcels p
     JOIN deliveries d ON d.id = p.delivery_id
     ${whereClause}
     ORDER BY p.id DESC`,
    params
  );
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
  notifyUnitResidents,
  listResidentNotifications,
  markResidentNotificationRead,
  findDeliveryById,
  linkVisitorPass,
  syncStatusFromVisitorPass,
  listDeliveries,
  updateDeliveryStatus,
  createParcel,
  findParcelById,
  listParcels,
  updateParcelStatus,
};
