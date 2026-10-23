CREATE TABLE IF NOT EXISTS society_management_committee_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES societies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  member_name VARCHAR(140) NOT NULL,
  designation VARCHAR(32) NOT NULL,
  unit_number VARCHAR(40),
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(255),
  term_start DATE,
  term_end DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT society_committee_designation_check CHECK (
    designation IN ('CHAIRPERSON', 'VICE_CHAIRPERSON', 'SECRETARY', 'JOINT_SECRETARY', 'TREASURER', 'COMMITTEE_MEMBER', 'OTHER')
  ),
  CONSTRAINT society_committee_term_check CHECK (term_start IS NULL OR term_end IS NULL OR term_end >= term_start)
);

CREATE INDEX IF NOT EXISTS society_committee_society_idx
  ON society_management_committee_members (society_id);
CREATE INDEX IF NOT EXISTS society_committee_designation_idx
  ON society_management_committee_members (society_id, designation);
