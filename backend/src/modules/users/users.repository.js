const db = require('../../config/db');

const PUBLIC_COLUMNS = `
  id, society_id, email, phone, first_name, last_name,
  status, last_login_at, created_at, updated_at
`;

const findByEmail = async (email) => {
  const result = await db.query('SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1', [String(email).trim()]);
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const findSecurityGuardHistoryIdentity = async (staffId) => {
  const result = await db.query(
    `SELECT staff_member.id AS staff_id, staff_member.employee_code, guard.user_id
       FROM staff staff_member
       JOIN security_guards guard ON guard.staff_id = staff_member.id
      WHERE staff_member.id = $1
        AND staff_member.staff_type = 'SECURITY_GUARD'
      LIMIT 1`,
    [staffId]
  );
  return result.rows[0] || null;
};

const isProfilePictureInUse = async (profilePictureUrl) => {
  if (!profilePictureUrl) return false;
  const result = await db.query(
    `SELECT EXISTS (
       SELECT 1 FROM users WHERE profile_picture_url = $1
       UNION ALL
       SELECT 1 FROM staff WHERE photo_path = $1
       UNION ALL
       SELECT 1 FROM residents WHERE profile_photo = $1
     ) AS in_use`,
    [profilePictureUrl]
  );
  return Boolean(result.rows[0]?.in_use);
};

const findNamesByIds = async (ids) => {
  if (!ids.length) return [];
  const result = await db.query(
    'SELECT id, first_name, last_name FROM users WHERE id = ANY($1::uuid[])',
    [ids]
  );
  return result.rows;
};

const listAccessibleSocieties = async (userId, isSuperAdmin = false) => {
  if (isSuperAdmin) {
    const result = await db.query('SELECT id, name FROM societies ORDER BY name, id');
    return result.rows;
  }

  const result = await db.query(
    `WITH accessible_societies AS (
       SELECT society_id AS id FROM users WHERE id = $1 AND society_id IS NOT NULL
       UNION
       SELECT usa.society_id AS id
       FROM user_society_access usa
       WHERE usa.user_id = $1
         AND usa.active_from <= now()
         AND (usa.active_until IS NULL OR usa.active_until > now())
       UNION
       SELECT msa.society_id AS id
       FROM multi_society_access msa
       WHERE msa.user_id = $1 AND msa.status = 'ACTIVE'
         AND msa.access_level = 'SOCIETY' AND msa.society_id IS NOT NULL
         AND (msa.start_date IS NULL OR msa.start_date <= CURRENT_DATE)
         AND (msa.end_date IS NULL OR msa.end_date >= CURRENT_DATE)
       UNION
       SELECT s.id
       FROM multi_society_access msa
       JOIN societies s ON (
         (msa.access_level = 'ORGANIZATION' AND s.organization_id = msa.organization_id)
         OR (msa.access_level = 'CLUSTER' AND s.cluster_id = msa.cluster_id)
       )
       WHERE msa.user_id = $1 AND msa.status = 'ACTIVE'
         AND (msa.start_date IS NULL OR msa.start_date <= CURRENT_DATE)
         AND (msa.end_date IS NULL OR msa.end_date >= CURRENT_DATE)
     )
     SELECT s.id, s.name
     FROM societies s JOIN accessible_societies a ON a.id = s.id
     ORDER BY s.name, s.id`,
    [userId]
  );
  return result.rows;
};

const hasSocietyAccess = async (userId, societyId) => {
  const result = await db.query(
    `SELECT EXISTS (
       SELECT 1 FROM users WHERE id = $1 AND society_id = $2
       UNION ALL
       SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1 AND ur.society_id IS NULL AND r.code = 'SUPER_ADMIN'
       UNION ALL
       SELECT 1 FROM user_society_access
       WHERE user_id = $1 AND society_id = $2
         AND active_from <= now() AND (active_until IS NULL OR active_until > now())
       UNION ALL
       SELECT 1 FROM multi_society_access
       WHERE user_id = $1 AND society_id = $2 AND access_level = 'SOCIETY'
         AND status = 'ACTIVE'
         AND (start_date IS NULL OR start_date <= CURRENT_DATE)
         AND (end_date IS NULL OR end_date >= CURRENT_DATE)
       UNION ALL
       SELECT 1 FROM multi_society_access msa
       JOIN societies s ON (
         (msa.access_level = 'ORGANIZATION' AND s.organization_id = msa.organization_id)
         OR (msa.access_level = 'CLUSTER' AND s.cluster_id = msa.cluster_id)
       )
       WHERE msa.user_id = $1 AND s.id = $2 AND msa.status = 'ACTIVE'
         AND (msa.start_date IS NULL OR msa.start_date <= CURRENT_DATE)
         AND (msa.end_date IS NULL OR msa.end_date >= CURRENT_DATE)
     ) AS allowed`,
    [userId, societyId]
  );
  return result.rows[0]?.allowed === true;
};

const createUser = async ({ societyId, email, phone, passwordHash, firstName, lastName, status, profilePictureUrl }) => {
  const result = await db.query(
    `INSERT INTO users (society_id, email, phone, password_hash, first_name, last_name, status, profile_picture_url)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'ACTIVE'), $8)
     RETURNING *`,
    [societyId || null, email, phone || null, passwordHash, firstName, lastName || null, status || null, profilePictureUrl || null]
  );
  return result.rows[0];
};

const updateProfile = async (id, { email, firstName, lastName, phone, societyId, profilePictureUrl, previousEmail, actorLabel, changedFields = [] }) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE users SET
         email = COALESCE($2, email),
         first_name = COALESCE($3, first_name),
         last_name  = COALESCE($4, last_name),
         phone      = CASE WHEN $5::text IS NULL THEN phone ELSE NULLIF($5::text, '') END,
         society_id = COALESCE($6, society_id),
         profile_picture_url = COALESCE($7, profile_picture_url),
         updated_at = now()
       WHERE id = $1::uuid
       RETURNING *`,
      [id, email, firstName, lastName, phone, societyId, profilePictureUrl]
    );
    const updated = result.rows[0] || null;
    if (updated) {
      await client.query(
        `UPDATE residents SET
           email = $2,
           first_name = $3,
           last_name = $4,
           mobile = CASE WHEN $5::text IS NULL OR $5::text = '' THEN mobile ELSE $5::text END,
           profile_photo = COALESCE($6, profile_photo),
           updated_at = now()
         WHERE user_id = $1::uuid
            OR (user_id IS NULL AND lower(email) = lower($7))`,
        [id, updated.email, updated.first_name, updated.last_name, updated.phone, updated.profile_picture_url, previousEmail]
      );
      await client.query(
        `UPDATE residents
            SET display_name = concat_ws(' ', first_name, NULLIF(middle_name, ''), last_name)
          WHERE user_id = $1::uuid
             OR (user_id IS NULL AND lower(email) = lower($2))`,
        [id, updated.email]
      );
      const residentResult = await client.query(
        `SELECT id, society_id FROM residents
          WHERE user_id = $1::uuid
             OR (user_id IS NULL AND lower(email) = lower($2))
          LIMIT 1`,
        [id, updated.email]
      );
      if (residentResult.rowCount && actorLabel && changedFields.length) {
        await client.query(
          `INSERT INTO notifications
             (society_id, user_id, channel, notification_type, title, subject, message,
              data, reference_type, reference_id, priority, status, is_read, created_at, updated_at)
           VALUES ($1, $2, 'IN_APP'::public.enum_notifications_channel,
              'OPERATIONAL'::public.enum_notifications_notification_type, 'Your resident profile was updated',
              'Your resident profile was updated', $3, $4::jsonb, 'RESIDENT_PROFILE', $5,
              'MEDIUM'::public.enum_notifications_priority,
              'PENDING'::public.enum_notifications_status, false, now(), now())`,
          [
            residentResult.rows[0].society_id,
            id,
            `${actorLabel} updated your resident profile. Updated: ${changedFields.join(', ')}.`,
            JSON.stringify({ changedFields }),
            residentResult.rows[0].id,
          ]
        );
      }
      if (residentResult.rowCount && !actorLabel && changedFields.length) {
        const resident = residentResult.rows[0];
        const residentName = [updated.first_name, updated.last_name].filter(Boolean).join(' ') || 'A resident';
        await client.query(
          `INSERT INTO notifications
             (society_id, user_id, channel, notification_type, title, subject, message,
              data, reference_type, reference_id, priority, status, is_read, created_at, updated_at)
           SELECT DISTINCT $1::uuid, u.id,
              'IN_APP'::public.enum_notifications_channel,
              'OPERATIONAL'::public.enum_notifications_notification_type,
              'Resident profile updated',
              'Resident profile updated', $2, $3::jsonb, 'RESIDENT_PROFILE', $4::uuid,
              'MEDIUM'::public.enum_notifications_priority,
              'PENDING'::public.enum_notifications_status, false, now(), now()
             FROM users u
             JOIN user_roles ur ON ur.user_id = u.id
             JOIN roles r ON r.id = ur.role_id AND r.status = 'ACTIVE'
            WHERE u.status = 'ACTIVE'
              AND r.code IN ('SOCIETY_ADMIN', 'SUPER_ADMIN', 'PRESIDENT_SECRETARY')
              AND (ur.society_id = $1::uuid OR (r.code = 'SUPER_ADMIN' AND ur.society_id IS NULL))
              AND u.id <> $5::uuid`,
          [
            resident.society_id,
            `${residentName} updated their profile. Updated: ${changedFields.join(', ')}.`,
            JSON.stringify({ residentId: resident.id, changedFields }),
            resident.id,
            id,
          ]
        );
      }

      const guardResult = await client.query(
        `WITH linked_guards AS (
           SELECT staff_member.id, staff_member.society_id
             FROM staff staff_member
             JOIN security_guards guard ON guard.staff_id = staff_member.id
            WHERE guard.user_id = $1::uuid
              AND staff_member.staff_type = 'SECURITY_GUARD'
         ), sole_guard AS (
           SELECT id, society_id
             FROM linked_guards
            WHERE (SELECT COUNT(*) FROM linked_guards) = 1
         )
         UPDATE staff staff_member SET
           first_name = $2,
           last_name = $3,
           email = $4,
           mobile_number = CASE WHEN $5::text IS NULL OR $5::text = '' THEN staff_member.mobile_number ELSE $5::text END,
           photo_path = COALESCE($6, staff_member.photo_path),
           updated_at = now()
          FROM sole_guard
         WHERE sole_guard.id = staff_member.id
        RETURNING staff_member.id, staff_member.society_id`,
        [id, updated.first_name, updated.last_name, updated.email, updated.phone, updated.profile_picture_url]
        );
      if (guardResult.rowCount && actorLabel) {
        const details = changedFields.length ? ` Updated: ${changedFields.join(', ')}.` : '';
        await client.query(
          `INSERT INTO notifications
             (society_id, user_id, channel, notification_type, title, subject, message,
              data, reference_type, priority, status, is_read, created_at, updated_at)
           VALUES ($1, $2, 'IN_APP', 'OPERATIONAL', 'Security profile updated',
              'Security profile updated', $3, $4::jsonb, 'SECURITY_PROFILE',
              'MEDIUM', 'PENDING', false, now(), now())`,
          [
            guardResult.rows[0].society_id,
            id,
            `${actorLabel} updated your profile details.${details}`,
            JSON.stringify({ staffId: guardResult.rows[0].id, changedFields }),
          ]
        );
      }
    }
    await client.query('COMMIT');
    return updated;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const isSecurityGuardUser = async (id) => {
  const result = await db.query(
    `SELECT 1 FROM security_guards sg
       JOIN staff st ON st.id = sg.staff_id
      WHERE sg.user_id = $1 AND st.staff_type = 'SECURITY_GUARD'
      LIMIT 1`,
    [id]
  );
  return Boolean(result.rowCount);
};

const isResidentUser = async (id, email = null) => {
  const result = await db.query(
    `SELECT 1 FROM residents
      WHERE user_id = $1
         OR (user_id IS NULL AND $2::text IS NOT NULL AND lower(email) = lower($2))
      LIMIT 1`,
    [id, email]
  );
  return Boolean(result.rowCount);
};

const updateStatus = async (id, status, { actorLabel, changedFields = [], residentEmail } = {}) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE users SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, status]
    );
    const updated = result.rows[0] || null;
    if (updated) {
      const staffStatus = status === 'ACTIVE' ? 'ACTIVE' : status === 'SUSPENDED' ? 'SUSPENDED' : 'INACTIVE';
      const guardStatus = status === 'ACTIVE' ? 'ACTIVE' : status === 'SUSPENDED' ? 'SUSPENDED' : 'INACTIVE';
      const guard = await client.query(
        `UPDATE staff staff_member SET status = $2, updated_at = now()
          FROM security_guards sg
         WHERE sg.staff_id = staff_member.id AND sg.user_id = $1
           AND staff_member.staff_type = 'SECURITY_GUARD'
         RETURNING staff_member.id, staff_member.society_id`,
        [id, staffStatus]
      );
      if (guard.rowCount) {
        await client.query(
          `UPDATE security_guards SET status = $2, updated_at = now() WHERE user_id = $1`,
          [id, guardStatus]
        );
        if (actorLabel) {
          await client.query(
            `INSERT INTO notifications
               (society_id, user_id, channel, notification_type, title, subject, message,
                data, reference_type, priority, status, is_read, created_at, updated_at)
             VALUES ($1, $2, 'IN_APP', 'OPERATIONAL', 'Security profile updated',
                'Security profile updated', $3, $4::jsonb, 'SECURITY_PROFILE',
                'MEDIUM', 'PENDING', false, now(), now())`,
            [
              guard.rows[0].society_id,
              id,
              `${actorLabel} updated your profile details. Updated: account status.`,
              JSON.stringify({ staffId: guard.rows[0].id, changedFields }),
            ]
          );
        }
      }
      const residentStatus = status === 'ACTIVE'
        ? 'ACTIVE'
        : status === 'PENDING'
          ? 'PENDING'
          : status === 'ARCHIVED'
            ? 'ARCHIVED'
            : 'SUSPENDED';
      const resident = await client.query(
        `UPDATE residents SET status = $2, updated_at = now()
          WHERE user_id = $1
             OR (user_id IS NULL AND $3::text IS NOT NULL AND lower(email) = lower($3))
          RETURNING id, society_id`,
        [id, residentStatus, residentEmail]
      );
      if (resident.rowCount && actorLabel) {
        await client.query(
          `INSERT INTO notifications
             (society_id, user_id, channel, notification_type, title, subject, message,
              data, reference_type, reference_id, priority, status, is_read, created_at, updated_at)
           VALUES ($1, $2, 'IN_APP', 'OPERATIONAL', 'Your resident profile was updated',
              'Your resident profile was updated', $3, $4::jsonb, 'RESIDENT_PROFILE', $5,
              'MEDIUM', 'PENDING', false, now(), now())`,
          [
            resident.rows[0].society_id,
            id,
            `${actorLabel} updated your account status to ${residentStatus.toLowerCase()}.`,
            JSON.stringify({ changedFields }),
            resident.rows[0].id,
          ]
        );
      }
    }
    await client.query('COMMIT');
    return updated;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const deleteInactiveUser = async (id) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const current = await client.query(
      'SELECT id, status FROM users WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (!current.rowCount) {
      await client.query('ROLLBACK');
      return null;
    }
    if (String(current.rows[0].status).toUpperCase() === 'ACTIVE') {
      const error = new Error('Cannot delete an active user. Deactivate the account first.');
      error.statusCode = 409;
      throw error;
    }

    const linkedGuards = await client.query(
      `SELECT staff_member.id, staff_member.status
         FROM security_guards guard
         JOIN staff staff_member ON staff_member.id = guard.staff_id
        WHERE guard.user_id = $1
        FOR UPDATE OF staff_member`,
      [id]
    );
    if (linkedGuards.rows.some((staff) => String(staff.status).toUpperCase() === 'ACTIVE')) {
      const error = new Error('Cannot delete this account while an active security guard is linked to it. Deactivate the guard first.');
      error.statusCode = 409;
      throw error;
    }
    if (linkedGuards.rowCount) {
      await client.query(
        `DELETE FROM staff
          WHERE id = ANY($1::uuid[])`,
        [linkedGuards.rows.map((staff) => staff.id)]
      );
    }

    const deleted = await client.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, email, first_name, last_name',
      [id]
    );
    await client.query('COMMIT');
    return deleted.rows[0] || null;
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23503') {
      const blocked = new Error('This user is linked to resident, staff, or other records and cannot be permanently deleted until those links are removed.');
      blocked.statusCode = 409;
      throw blocked;
    }
    throw error;
  } finally {
    client.release();
  }
};

const updatePassword = async (id, passwordHash) => {
  await db.query(`UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`, [id, passwordHash]);
};

const updateLastLogin = async (id) => {
  await db.query('UPDATE users SET last_login_at = now() WHERE id = $1', [id]);
};

const listUsers = async ({ societyId, status, search, limit, offset }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (societyId) {
    conditions.push(`directory_rows.society_id = $${idx}`);
    params.push(societyId);
    idx += 1;
  }
  if (status) {
    conditions.push(`directory_rows.status = $${idx++}`);
    params.push(status);
  }
  if (search) {
    conditions.push(`(directory_rows.email ILIKE $${idx} OR directory_rows.first_name ILIKE $${idx} OR directory_rows.last_name ILIKE $${idx} OR directory_rows.phone ILIKE $${idx} OR directory_rows.employee_code ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx += 1;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const directoryCte = `WITH directory_rows AS (
    SELECT users.id, users.society_id, users.email, users.phone,
           users.first_name, users.last_name, users.status,
           users.last_login_at, users.created_at, users.updated_at,
           NULLIF(users.profile_picture_url, '') AS profile_picture_url,
           ARRAY(
             SELECT r.name
               FROM user_roles ur
               JOIN roles r ON r.id = ur.role_id
              WHERE ur.user_id = users.id
                AND (ur.society_id IS NULL OR ur.society_id = users.society_id)
              ORDER BY r.name
           ) AS roles,
           'USER'::text AS record_type,
           NULL::text AS employee_code,
           NULL::uuid AS staff_id,
           users.id AS login_user_id
      FROM users
     WHERE NOT EXISTS (
       SELECT 1
         FROM security_guards guard
         JOIN staff staff_member ON staff_member.id = guard.staff_id
        WHERE guard.user_id = users.id
          AND staff_member.staff_type = 'SECURITY_GUARD'
     )

    UNION ALL

    SELECT staff_member.id, staff_member.society_id,
           COALESCE(NULLIF(staff_member.email, ''), account.email) AS email,
           staff_member.mobile_number AS phone,
           staff_member.first_name, staff_member.last_name,
           staff_member.status::text AS status,
           account.last_login_at, staff_member.created_at, staff_member.updated_at,
           NULLIF(staff_member.photo_path, '') AS profile_picture_url,
           ARRAY(
             SELECT role.name
               FROM user_roles assigned_role
               JOIN roles role ON role.id = assigned_role.role_id
              WHERE assigned_role.user_id = guard.user_id
                AND (assigned_role.society_id IS NULL OR assigned_role.society_id = staff_member.society_id)
              ORDER BY role.name
           ) AS roles,
           'SECURITY_GUARD'::text AS record_type,
           staff_member.employee_code,
           staff_member.id AS staff_id,
           guard.user_id AS login_user_id
      FROM security_guards guard
      JOIN staff staff_member ON staff_member.id = guard.staff_id
      JOIN users account ON account.id = guard.user_id
     WHERE staff_member.staff_type = 'SECURITY_GUARD'
  )`;

  const dataResult = await db.query(
    `${directoryCte}
     SELECT directory_rows.*
       FROM directory_rows
       ${whereClause}
      ORDER BY created_at DESC, first_name, last_name
      LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );

  const countResult = await db.query(
    `${directoryCte}
     SELECT COUNT(*)::int AS total
       FROM directory_rows
       ${whereClause}`,
    params
  );

  return { rows: dataResult.rows, total: countResult.rows[0].total };
};

module.exports = {
  findByEmail,
  findById,
  findSecurityGuardHistoryIdentity,
  isProfilePictureInUse,
  findNamesByIds,
  listAccessibleSocieties,
  hasSocietyAccess,
  createUser,
  updateProfile,
  isSecurityGuardUser,
  isResidentUser,
  updateStatus,
  deleteInactiveUser,
  updatePassword,
  updateLastLogin,
  listUsers,
};
