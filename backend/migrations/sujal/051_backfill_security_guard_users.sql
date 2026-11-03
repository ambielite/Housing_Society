-- Ensure existing security-guard staff have a linked User Management account
-- and the Security Head role. Generated accounts use an unmatchable password
-- sentinel and remain usable only for directory/RBAC administration.

INSERT INTO public.security_guards (staff_id, user_id, employee_code, status)
SELECT
  s.id,
  NULL,
  s.employee_code,
  CASE
    WHEN s.status = 'ACTIVE' THEN 'ACTIVE'
    WHEN s.status = 'INACTIVE' THEN 'INACTIVE'
    ELSE 'SUSPENDED'
  END
FROM public.staff s
WHERE s.staff_type = 'SECURITY_GUARD'
ON CONFLICT (staff_id) WHERE staff_id IS NOT NULL DO NOTHING;

-- Reuse a user account already associated with this society and email.
UPDATE public.security_guards g
SET user_id = u.id,
    updated_at = now()
FROM public.staff s
JOIN public.users u ON lower(u.email) = lower(s.email)
WHERE g.staff_id = s.id
  AND g.user_id IS NULL
  AND s.staff_type = 'SECURITY_GUARD'
  AND nullif(trim(s.email), '') IS NOT NULL
  AND (
    u.society_id = s.society_id
    OR EXISTS (
      SELECT 1
      FROM public.user_society_access usa
      WHERE usa.user_id = u.id
        AND usa.society_id = s.society_id
        AND usa.active_from <= now()
        AND (usa.active_until IS NULL OR usa.active_until > now())
    )
  );

-- Create active directory accounts for guards that do not yet have a
-- matching user. Use an internal address when staff has no email, or when
-- that email is already owned by an account in another society.
WITH unlinked_guards AS (
  SELECT
    s.id,
    s.society_id,
    s.first_name,
    s.last_name,
    s.mobile_number,
    CASE
      WHEN nullif(trim(s.email), '') IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM public.users existing
         WHERE lower(existing.email) = lower(trim(s.email))
       )
      THEN lower(trim(s.email))
      ELSE 'security-guard+' || s.id::text || '@no-login.invalid'
    END AS account_email
  FROM public.staff s
  JOIN public.security_guards g ON g.staff_id = s.id
  WHERE s.staff_type = 'SECURITY_GUARD'
    AND g.user_id IS NULL
)
INSERT INTO public.users (
  society_id, email, phone, password_hash, first_name, last_name, status
)
SELECT
  society_id,
  account_email,
  mobile_number,
  '!SECURITY_GUARD_NO_LOGIN!' || gen_random_uuid()::text,
  first_name,
  last_name,
  'ACTIVE'
FROM unlinked_guards
ON CONFLICT (email) DO NOTHING;

-- Link the just-created accounts to their staff records.
UPDATE public.security_guards g
SET user_id = u.id,
    updated_at = now()
FROM public.staff s
JOIN public.users u ON (
  (
    nullif(trim(s.email), '') IS NOT NULL
    AND lower(u.email) = lower(trim(s.email))
    AND (
      u.society_id = s.society_id
      OR EXISTS (
        SELECT 1
        FROM public.user_society_access usa
        WHERE usa.user_id = u.id
          AND usa.society_id = s.society_id
          AND usa.active_from <= now()
          AND (usa.active_until IS NULL OR usa.active_until > now())
      )
    )
  )
  OR u.email = 'security-guard+' || s.id::text || '@no-login.invalid'
)
WHERE g.staff_id = s.id
  AND g.user_id IS NULL
  AND s.staff_type = 'SECURITY_GUARD';

INSERT INTO public.user_roles (user_id, role_id, society_id)
SELECT g.user_id, r.id, s.society_id
FROM public.security_guards g
JOIN public.staff s ON s.id = g.staff_id
JOIN public.roles r ON r.code = 'SECURITY_HEAD' AND r.society_id IS NULL
WHERE s.staff_type = 'SECURITY_GUARD'
  AND g.user_id IS NOT NULL
ON CONFLICT (user_id, role_id)
DO UPDATE SET society_id = EXCLUDED.society_id, assigned_at = now();
