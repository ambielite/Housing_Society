-- Password reset codes are stored as server-keyed hashes and expire quickly.
-- Keep failed guesses in PostgreSQL so limits survive restarts and deployments.
ALTER TABLE password_reset_tokens
  ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;

ALTER TABLE password_reset_tokens
  ADD CONSTRAINT password_reset_tokens_attempts_nonnegative
  CHECK (attempts >= 0) NOT VALID;

ALTER TABLE password_reset_tokens
  VALIDATE CONSTRAINT password_reset_tokens_attempts_nonnegative;

CREATE INDEX IF NOT EXISTS idx_pw_reset_recent_user
  ON password_reset_tokens (user_id, created_at DESC);
