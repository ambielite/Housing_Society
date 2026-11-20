DROP INDEX IF EXISTS staff_rosters_staff_id_roster_date;

CREATE INDEX IF NOT EXISTS staff_rosters_staff_id_roster_date
    ON staff_rosters (staff_id, roster_date);
