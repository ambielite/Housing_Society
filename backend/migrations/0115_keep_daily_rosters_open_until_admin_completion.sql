ALTER TABLE staff_rosters
    ALTER COLUMN roster_end_date DROP NOT NULL;

UPDATE staff_rosters
   SET roster_end_date = NULL
 WHERE roster_type = 'DAILY'
   AND status NOT IN ('CANCELLED', 'COMPLETED');
