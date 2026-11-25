ALTER TABLE kids_activities
  ADD COLUMN IF NOT EXISTS minimum_age SMALLINT NOT NULL DEFAULT 1
    CHECK (minimum_age BETWEEN 0 AND 18);

ALTER TABLE kids_activities
  ADD CONSTRAINT kids_activities_age_range_check
    CHECK (minimum_age <= maximum_age);
