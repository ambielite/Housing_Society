-- Store the admin staff employee code with maid visitor profiles so gate
-- entry and exit can update attendance for the correct Maid record.
ALTER TABLE public.visitor_profiles
  ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50);
