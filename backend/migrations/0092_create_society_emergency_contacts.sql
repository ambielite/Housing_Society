CREATE TABLE IF NOT EXISTS society_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES societies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  name VARCHAR(140) NOT NULL,
  category VARCHAR(40) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  alternate_phone VARCHAR(30),
  email VARCHAR(255),
  address VARCHAR(500),
  operating_hours VARCHAR(120),
  available_24x7 BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT society_emergency_contacts_category_check CHECK (
    category IN ('POLICE', 'FIRE', 'AMBULANCE', 'HOSPITAL', 'SECURITY', 'ELECTRICITY', 'WATER', 'GAS', 'DISASTER_RESPONSE', 'SOCIETY_OFFICE', 'OTHER')
  )
);

CREATE INDEX IF NOT EXISTS society_emergency_contacts_society_idx
  ON society_emergency_contacts (society_id);
CREATE INDEX IF NOT EXISTS society_emergency_contacts_category_idx
  ON society_emergency_contacts (society_id, category);
