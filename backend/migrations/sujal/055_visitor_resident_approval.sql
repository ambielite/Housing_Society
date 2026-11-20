-- Guard walk-ins addressed to a resident must be explicitly approved before entry.
ALTER TABLE public.visitor_passes
  ADD COLUMN IF NOT EXISTS resident_decision VARCHAR(20) NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN IF NOT EXISTS resident_decided_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resident_decided_by UUID REFERENCES public.residents(id);

UPDATE public.visitor_passes
   SET resident_decision = 'PENDING'
 WHERE resident_id IS NOT NULL
   AND invite_id IS NULL
   AND status IN ('EXPECTED', 'ARRIVED')
   AND resident_decision = 'NOT_REQUIRED';

CREATE INDEX IF NOT EXISTS idx_visitor_passes_resident_decision
  ON public.visitor_passes (resident_id, resident_decision, status);
