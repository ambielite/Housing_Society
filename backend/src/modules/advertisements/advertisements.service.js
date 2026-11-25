const { query } = require('../../config/db');
const ApiError = require('../../common/ApiError');
const storage = require('./advertisements.storage');
const residentDashboardEvents = require('../resident-dashboard/residentDashboardEvents');

const validateInput = (input, file, existingImage) => {
  const title = String(input.title || '').trim();
  const description = String(input.description || '').trim() || null;
  const startsOn = String(input.startsOn || '').slice(0, 10);
  const endsOn = String(input.endsOn || '').slice(0, 10);
  const maxViews = Number(input.maxViewsPerResident);
  if (!title || title.length > 200) throw new ApiError(400, 'Enter an advertisement title of up to 200 characters');
  const validDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if (!validDate(startsOn)) throw new ApiError(400, 'Choose a valid start date');
  if (!validDate(endsOn)) throw new ApiError(400, 'Choose a valid end date');
  if (endsOn < startsOn) throw new ApiError(400, 'End date must be on or after the start date');
  if (!Number.isInteger(maxViews) || maxViews < 1 || maxViews > 1000) throw new ApiError(400, 'Maximum views must be between 1 and 1000 per resident');
  if (description && description.length > 3000) throw new ApiError(400, 'Description must be 3000 characters or fewer');
  if (!file && !existingImage) throw new ApiError(400, 'Upload an advertisement image or banner');
  if (file && !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) throw new ApiError(400, 'Choose a JPG, PNG, WEBP, or GIF image');
  return { title, description, startsOn, endsOn, maxViews, isActive: input.isActive == null ? true : input.isActive === true || input.isActive === 'true' };
};

const publishToResidents = async (societyId) => {
  try {
    const result = await query(
      `SELECT DISTINCT account.id AS user_id
         FROM residents resident
         JOIN users account ON account.society_id = resident.society_id
          AND (account.id = resident.user_id OR (resident.user_id IS NULL AND lower(account.email) = lower(resident.email)))
        WHERE resident.society_id = $1 AND resident.status = 'ACTIVE' AND account.status = 'ACTIVE'`,
      [societyId],
    );
    residentDashboardEvents.publishToUsers(result.rows.map((row) => row.user_id), 'advertisement-updated');
  } catch (error) {
    console.warn('Could not broadcast advertisement change to resident feeds:', error.message);
  }
};

const listForAdmin = async (societyId) => {
  const result = await query(
    `SELECT ad.*,
            COALESCE(state.total_resident_views, 0)::int AS total_resident_views,
            CASE WHEN NOT ad.is_active THEN 'INACTIVE'
                 WHEN ad.ends_on < timezone('Asia/Kolkata', now())::date THEN 'EXPIRED'
                 WHEN ad.starts_on > timezone('Asia/Kolkata', now())::date THEN 'SCHEDULED'
                 ELSE 'ACTIVE' END AS display_status
       FROM advertisements ad
       LEFT JOIN (
         SELECT advertisement_id, SUM(impression_count)::int AS total_resident_views
           FROM advertisement_resident_state GROUP BY advertisement_id
       ) state ON state.advertisement_id = ad.id
      WHERE ad.society_id = $1
      ORDER BY ad.created_at DESC`,
    [societyId],
  );
  return result.rows;
};

const listForResident = async (user) => {
  if (!user.societyId) return [];
  const result = await query(
    `SELECT ad.id, ad.title, ad.image_url, ad.description, ad.starts_on, ad.ends_on,
            ad.max_views_per_resident, COALESCE(state.impression_count, 0)::int AS impression_count
       FROM advertisements ad
       LEFT JOIN advertisement_resident_state state
         ON state.advertisement_id = ad.id AND state.user_id = $2 AND state.society_id = $1
      WHERE ad.society_id = $1 AND ad.is_active = TRUE
        AND ad.ends_on >= timezone('Asia/Kolkata', now())::date
        AND COALESCE(state.impression_count, 0) < ad.max_views_per_resident
        AND state.dismissed_at IS NULL
      ORDER BY ad.created_at DESC`,
    [user.societyId, user.id],
  );
  return result.rows;
};

const create = async (user, input, file) => {
  const values = validateInput(input, file, null);
  let imageUrl;
  try {
    imageUrl = storage.saveImage(file);
    const result = await query(
      `INSERT INTO advertisements
         (society_id, created_by, updated_by, title, image_url, description, starts_on, ends_on, max_views_per_resident, is_active)
       VALUES ($1, $2, $2, $3, $4, $5, $6::date, $7::date, $8, $9) RETURNING *`,
      [user.societyId, user.id, values.title, imageUrl, values.description, values.startsOn, values.endsOn, values.maxViews, values.isActive],
    );
    await publishToResidents(user.societyId);
    return result.rows[0];
  } catch (error) {
    if (imageUrl) storage.removeImage(imageUrl);
    throw error;
  }
};

const update = async (user, id, input, file) => {
  const current = await query('SELECT * FROM advertisements WHERE id = $1 AND society_id = $2', [id, user.societyId]);
  if (!current.rows[0]) throw new ApiError(404, 'Advertisement not found');
  const old = current.rows[0];
  const values = validateInput(input, file, old.image_url);
  const imageUrl = file ? storage.saveImage(file) : old.image_url;
  try {
    const result = await query(
      `UPDATE advertisements
          SET updated_by = $3, title = $4, image_url = $5, description = $6,
              starts_on = $7::date, ends_on = $8::date, max_views_per_resident = $9,
              is_active = $10, updated_at = now()
        WHERE id = $1 AND society_id = $2 RETURNING *`,
      [id, user.societyId, user.id, values.title, imageUrl, values.description, values.startsOn, values.endsOn, values.maxViews, values.isActive],
    );
    if (file) storage.removeImage(old.image_url);
    await publishToResidents(user.societyId);
    return result.rows[0];
  } catch (error) {
    if (file) storage.removeImage(imageUrl);
    throw error;
  }
};

const setActive = async (user, id, isActive) => {
  const result = await query(
    `UPDATE advertisements SET is_active = $3, updated_by = $4, updated_at = now()
      WHERE id = $1 AND society_id = $2 RETURNING id`,
    [id, user.societyId, Boolean(isActive), user.id],
  );
  if (!result.rowCount) throw new ApiError(404, 'Advertisement not found');
  await publishToResidents(user.societyId);
  return result.rows[0];
};

const remove = async (user, id) => {
  const result = await query('DELETE FROM advertisements WHERE id = $1 AND society_id = $2 RETURNING image_url', [id, user.societyId]);
  if (!result.rows[0]) throw new ApiError(404, 'Advertisement not found');
  storage.removeImage(result.rows[0].image_url);
  await publishToResidents(user.societyId);
  return { id };
};

const recordImpression = async (user, id) => {
  const result = await query(
    `INSERT INTO advertisement_resident_state
       (advertisement_id, society_id, user_id, impression_count, last_viewed_at, updated_at)
     SELECT ad.id, ad.society_id, $2, 1, now(), now()
       FROM advertisements ad
      WHERE ad.id = $1 AND ad.society_id = $3 AND ad.is_active
        AND ad.starts_on <= timezone('Asia/Kolkata', now())::date
        AND ad.ends_on >= timezone('Asia/Kolkata', now())::date
        AND ad.max_views_per_resident > 0
     ON CONFLICT (advertisement_id, user_id) DO UPDATE
       SET impression_count = advertisement_resident_state.impression_count + 1,
           last_viewed_at = now(), updated_at = now()
       WHERE advertisement_resident_state.dismissed_at IS NULL
         AND advertisement_resident_state.impression_count < (
           SELECT max_views_per_resident FROM advertisements WHERE id = $1
         )
     RETURNING impression_count`,
    [id, user.id, user.societyId],
  );
  if (!result.rowCount) throw new ApiError(409, 'This advertisement is no longer available');
  return { impressionCount: result.rows[0].impression_count };
};

const dismiss = async (user, id) => {
  const result = await query(
    `INSERT INTO advertisement_resident_state
       (advertisement_id, society_id, user_id, dismissed_at, updated_at)
     SELECT ad.id, ad.society_id, $2, now(), now()
       FROM advertisements ad WHERE ad.id = $1 AND ad.society_id = $3
     ON CONFLICT (advertisement_id, user_id) DO UPDATE
       SET dismissed_at = COALESCE(advertisement_resident_state.dismissed_at, now()), updated_at = now()
     RETURNING advertisement_id`,
    [id, user.id, user.societyId],
  );
  if (!result.rowCount) throw new ApiError(404, 'Advertisement not found');
  return { id };
};

module.exports = { listForAdmin, listForResident, create, update, setActive, remove, recordImpression, dismiss };
