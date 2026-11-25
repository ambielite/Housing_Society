-- Allow Helpdesk tickets to be assigned directly to staff records that do
-- not have a linked login account.
ALTER TABLE public.ticket_assignments
  ADD COLUMN IF NOT EXISTS assigned_staff_id UUID
  REFERENCES public.staff(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ticket_assignments_staff
  ON public.ticket_assignments (assigned_staff_id)
  WHERE assigned_staff_id IS NOT NULL;
