CREATE TABLE IF NOT EXISTS kids_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  activity_date DATE NOT NULL,
  activity_day VARCHAR(12) NOT NULL,
  activity_time TIME NOT NULL,
  maximum_age SMALLINT NOT NULL CHECK (maximum_age BETWEEN 1 AND 18),
  winner_prize VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CANCELLED', 'COMPLETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kids_activities_society_date_idx
  ON kids_activities (society_id, activity_date, created_at DESC);

CREATE TABLE IF NOT EXISTS kids_activity_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES kids_activities(id) ON DELETE CASCADE,
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (activity_id, user_id)
);

CREATE TABLE IF NOT EXISTS kids_activity_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES kids_activity_registrations(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  age SMALLINT NOT NULL CHECK (age BETWEEN 0 AND 18),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kids_activity_children_registration_idx
  ON kids_activity_children (registration_id, created_at);
