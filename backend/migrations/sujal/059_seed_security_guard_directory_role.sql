-- Distinguish guard profiles from their shared Security Head login in the
-- User Management directory. Authentication still uses the linked login.
INSERT INTO public.roles (society_id, name, code, description, is_system_role, status)
VALUES (NULL, 'Security Guard', 'SECURITY_GUARD', 'Individual security guard staff profile', true, 'ACTIVE')
ON CONFLICT (code) WHERE society_id IS NULL DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id, society_id)
SELECT DISTINCT guard.user_id, role.id, staff_member.society_id
  FROM public.security_guards guard
  JOIN public.staff staff_member ON staff_member.id = guard.staff_id
  JOIN public.roles role ON role.code = 'SECURITY_GUARD' AND role.society_id IS NULL
 WHERE staff_member.staff_type = 'SECURITY_GUARD'
   AND guard.user_id IS NOT NULL
ON CONFLICT (user_id, role_id)
DO UPDATE SET society_id = EXCLUDED.society_id, assigned_at = now();
