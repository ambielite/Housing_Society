const { query } = require('../../config/db');
const ApiError = require('../../common/ApiError');

const resolveResident = async (user, { allowEmailFallback = true } = {}) => {
  if (!user?.societyId) return null;

  const linked = await query(
    `SELECT id, display_name, profile_photo, email, mobile, alternate_mobile,
            date_of_birth, role, status
       FROM residents
      WHERE society_id = $1 AND user_id = $2 AND status = 'ACTIVE'
      ORDER BY id ASC`,
    [user.societyId, user.id],
  );
  if (linked.rows.length > 1) {
    throw new ApiError(409, 'Multiple active Resident profiles are linked to this account');
  }
  if (linked.rows.length === 1) return linked.rows[0];

  if (!allowEmailFallback || !user.email) return null;
  const emailMatches = await query(
    `SELECT id, display_name, profile_photo, email, mobile, alternate_mobile,
            date_of_birth, role, status
       FROM residents
      WHERE society_id = $1 AND user_id IS NULL AND status = 'ACTIVE'
        AND lower(email) = lower($2)
      ORDER BY id ASC`,
    [user.societyId, user.email],
  );
  if (emailMatches.rows.length > 1) {
    throw new ApiError(409, 'Multiple active Resident profiles match this account email');
  }
  return emailMatches.rows[0] || null;
};

const listEligibleUnits = async (societyId, residentId) => {
  if (!societyId || !residentId) return [];

  const result = await query(
    `WITH eligible_relationships AS (
       SELECT ou.unit_id, ou.effective_from AS relationship_start, 0 AS occupancy_priority
         FROM owner_units ou
        WHERE ou.society_id = $1 AND ou.owner_id = $2 AND ou.status = 'ACTIVE'
          AND ou.effective_from <= CURRENT_DATE
          AND (ou.effective_to IS NULL OR ou.effective_to >= CURRENT_DATE)
       UNION ALL
       SELECT o.unit_id, o.start_date AS relationship_start, 1 AS occupancy_priority
         FROM occupancies o
        WHERE o.society_id = $1 AND o.resident_id = $2
          AND o.occupancy_type IN ('OWNER', 'TENANT') AND o.is_current = true
          AND o.start_date <= CURRENT_DATE
          AND (o.end_date IS NULL OR o.end_date >= CURRENT_DATE)
     )
     SELECT u.id AS unit_id, u.unit_number, f.name AS floor_name, t.name AS tower_name
       FROM eligible_relationships rel
       JOIN units u ON u.id = rel.unit_id
       JOIN floors f ON f.id = u.floor_id
       JOIN towers t ON t.id = f.tower_id AND t.society_id = $1
      GROUP BY u.id, u.unit_number, f.name, t.name
      ORDER BY MAX(rel.occupancy_priority) DESC,
               MAX(rel.relationship_start) DESC,
               u.id ASC`,
    [societyId, residentId],
  );

  const uniqueUnits = new Map();
  for (const unit of result.rows) {
    if (!uniqueUnits.has(unit.unit_id)) uniqueUnits.set(unit.unit_id, unit);
  }
  return [...uniqueUnits.values()];
};

const resolveResidentUnits = async (user, options = {}) => {
  const resident = await resolveResident(user, options);
  if (!resident) return { resident: null, units: [] };
  const units = await listEligibleUnits(user.societyId, resident.id);
  return { resident, units };
};

const selectSingleUnit = (context) => {
  if (!context.resident) {
    throw new ApiError(403, 'Your active Resident profile is not linked to this account');
  }
  if (context.units.length === 0) {
    throw new ApiError(403, 'Your Resident profile is not linked to an active Unit');
  }
  if (context.units.length > 1) {
    throw new ApiError(409, 'Your Resident profile is linked to multiple active Units');
  }
  return context.units[0];
};

const resolveSingleUnit = async (user, options = {}) => {
  const context = await resolveResidentUnits(user, options);
  return { ...context, unit: selectSingleUnit(context) };
};

module.exports = { resolveResident, listEligibleUnits, resolveResidentUnits, selectSingleUnit, resolveSingleUnit };
