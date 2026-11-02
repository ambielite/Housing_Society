-- Link resident directory records to the login accounts used by the mobile app.
ALTER TABLE public.residents
  ADD COLUMN IF NOT EXISTS user_id UUID
    REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS residents_society_user_unique
  ON public.residents (society_id, user_id)
  WHERE user_id IS NOT NULL;
