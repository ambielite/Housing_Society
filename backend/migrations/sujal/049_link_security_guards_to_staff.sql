-- Link guard records to staff profiles so the staff form is the source of truth.
ALTER TABLE public.security_guards
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.security_guards
  ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS security_guards_staff_id_unique
  ON public.security_guards (staff_id)
  WHERE staff_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS security_guards_staff_id_idx
  ON public.security_guards (staff_id);

-- Register existing staff records that are already typed as security guards.
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
ON CONFLICT (staff_id) WHERE staff_id IS NOT NULL DO UPDATE
SET employee_code = EXCLUDED.employee_code,
    status = EXCLUDED.status,
    updated_at = now();
