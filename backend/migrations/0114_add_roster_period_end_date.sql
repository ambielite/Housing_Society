ALTER TABLE staff_rosters
    ADD COLUMN roster_end_date DATE;

UPDATE staff_rosters
   SET roster_end_date = CASE roster_type
       WHEN 'WEEKLY' THEN roster_date + 6
       WHEN 'MONTHLY' THEN (roster_date + INTERVAL '1 month')::date - 1
       ELSE roster_date
   END
 WHERE roster_end_date IS NULL;

ALTER TABLE staff_rosters
    ALTER COLUMN roster_end_date SET NOT NULL;

CREATE INDEX IF NOT EXISTS staff_rosters_active_period_idx
    ON staff_rosters (staff_id, roster_date, roster_end_date)
    WHERE status IN ('SCHEDULED', 'CONFIRMED');
