ALTER TABLE staff_rosters
    ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS staff_rosters_cancelled_at_idx
    ON staff_rosters (cancelled_at)
    WHERE cancelled_at IS NOT NULL;
