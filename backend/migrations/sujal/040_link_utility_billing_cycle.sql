-- Utility billing cycles are represented by Finance billing_configs rows
-- with config_type = BILLING_CYCLE.

UPDATE utility_bills ub
SET billing_cycle_id = NULL
WHERE billing_cycle_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM billing_configs bc
    JOIN meters m ON m.id = ub.meter_id
    WHERE bc.id = ub.billing_cycle_id
      AND bc.config_type = 'BILLING_CYCLE'
      AND bc.society_id = m.society_id
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'utility_bills_billing_cycle_id_fkey'
      AND conrelid = 'utility_bills'::regclass
  ) THEN
    ALTER TABLE utility_bills
      ADD CONSTRAINT utility_bills_billing_cycle_id_fkey
      FOREIGN KEY (billing_cycle_id) REFERENCES billing_configs(id) ON DELETE SET NULL;
  END IF;
END $$;
