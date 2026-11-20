-- User Management assignments must also appear in the Staff directory.
-- SECURITY_HEAD accounts without an existing guard profile receive a linked
-- security staff record with a generated, society-unique employee code.

WITH security_users AS (
  SELECT DISTINCT ON (u.id)
    u.id AS user_id,
    COALESCE(ur.society_id, u.society_id) AS society_id,
    u.email,
    u.phone,
    u.first_name,
    u.last_name,
    u.profile_picture_url,
    u.status
  FROM public.users u
  JOIN public.user_roles ur ON ur.user_id = u.id
  JOIN public.roles r ON r.id = ur.role_id AND r.code = 'SECURITY_HEAD'
  WHERE COALESCE(ur.society_id, u.society_id) IS NOT NULL
  ORDER BY u.id, ur.society_id NULLS LAST
), unlinked_users AS (
  SELECT su.*
  FROM security_users su
  WHERE NOT EXISTS (
    SELECT 1 FROM public.security_guards sg WHERE sg.user_id = su.user_id
  )
), matching_staff AS (
  SELECT DISTINCT ON (uu.user_id)
    uu.user_id,
    uu.society_id,
    s.id AS staff_id,
    s.employee_code,
    uu.status
  FROM unlinked_users uu
  JOIN public.staff s
    ON s.society_id = uu.society_id
   AND s.staff_type = 'SECURITY_GUARD'
   AND uu.email IS NOT NULL
   AND lower(s.email) = lower(uu.email)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.security_guards linked WHERE linked.staff_id = s.id
  )
  ORDER BY uu.user_id, s.created_at
)
INSERT INTO public.security_guards (staff_id, user_id, employee_code, status)
SELECT
  staff_id,
  user_id,
  employee_code,
  CASE WHEN status = 'ACTIVE' THEN 'ACTIVE' ELSE 'INACTIVE' END
FROM matching_staff
ON CONFLICT (staff_id) WHERE staff_id IS NOT NULL DO UPDATE
SET user_id = EXCLUDED.user_id,
    employee_code = EXCLUDED.employee_code,
    status = EXCLUDED.status,
    updated_at = now();

WITH security_users AS (
  SELECT DISTINCT ON (u.id)
    u.id AS user_id,
    COALESCE(ur.society_id, u.society_id) AS society_id,
    u.email,
    u.phone,
    u.first_name,
    u.last_name,
    u.profile_picture_url,
    u.status
  FROM public.users u
  JOIN public.user_roles ur ON ur.user_id = u.id
  JOIN public.roles r ON r.id = ur.role_id AND r.code = 'SECURITY_HEAD'
  WHERE COALESCE(ur.society_id, u.society_id) IS NOT NULL
  ORDER BY u.id, ur.society_id NULLS LAST
), users_without_staff AS (
  SELECT su.*
  FROM security_users su
  WHERE NOT EXISTS (
    SELECT 1 FROM public.security_guards sg WHERE sg.user_id = su.user_id
  )
    AND NOT EXISTS (
      SELECT 1 FROM public.staff s
       WHERE s.society_id = su.society_id
         AND s.staff_type = 'SECURITY_GUARD'
         AND su.email IS NOT NULL
         AND lower(s.email) = lower(su.email)
    )
), staff_to_create AS (
  SELECT users_without_staff.*,
         'SG-' || upper(replace(user_id::text, '-', '')) AS generated_employee_code
  FROM users_without_staff
), created_staff AS (
  INSERT INTO public.staff (
    society_id, employee_code, first_name, last_name, mobile_number, email,
    joining_date, staff_type, designation, department, status, photo_path,
    created_at, updated_at
  )
  SELECT
    society_id,
    generated_employee_code,
    COALESCE(NULLIF(first_name, ''), 'Security'),
    last_name,
    COALESCE(NULLIF(phone, ''), 'Not provided'),
    email,
    CURRENT_DATE,
    'SECURITY_GUARD',
    'Security Head',
    'Security',
    (CASE WHEN status = 'ACTIVE' THEN 'ACTIVE' ELSE 'INACTIVE' END)::public.enum_staff_status,
    profile_picture_url,
    now(), now()
  FROM staff_to_create
  RETURNING id, society_id, employee_code
)
INSERT INTO public.security_guards (staff_id, user_id, employee_code, status)
SELECT cs.id, stc.user_id, cs.employee_code,
       CASE WHEN stc.status = 'ACTIVE' THEN 'ACTIVE' ELSE 'INACTIVE' END
FROM created_staff cs
JOIN staff_to_create stc ON stc.society_id = cs.society_id
  AND stc.generated_employee_code = cs.employee_code
ON CONFLICT (staff_id) WHERE staff_id IS NOT NULL DO UPDATE
SET user_id = EXCLUDED.user_id,
    employee_code = EXCLUDED.employee_code,
    status = EXCLUDED.status,
    updated_at = now();
