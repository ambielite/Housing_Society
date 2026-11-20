-- Store guard sign-ins against the individual staff profile selected by
-- employee code, while preserving the shared authentication account link.
ALTER TABLE public.login_history
  ADD COLUMN IF NOT EXISTS staff_id UUID
    REFERENCES public.staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_login_history_staff
  ON public.login_history(staff_id, login_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_history_employee_code
  ON public.login_history(user_id, upper(employee_code), login_at DESC)
  WHERE employee_code IS NOT NULL;
