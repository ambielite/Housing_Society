-- Security Guard accounts are maintained as active user-directory records.
-- Scope this status update only to accounts linked to Security Guard staff.
UPDATE public.users u
SET status = 'ACTIVE',
    updated_at = now()
FROM public.security_guards g
JOIN public.staff s ON s.id = g.staff_id
WHERE g.user_id = u.id
  AND s.staff_type = 'SECURITY_GUARD'
  AND u.status <> 'ACTIVE';
