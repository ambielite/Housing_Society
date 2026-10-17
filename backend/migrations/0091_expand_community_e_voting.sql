-- Configurable, society-approved voting rules and privacy-preserving vote storage.
ALTER TABLE community_votings
    ADD COLUMN IF NOT EXISTS eligibility_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS legal_basis TEXT,
    ADD COLUMN IF NOT EXISTS rules_approved BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS rules_approved_by UUID,
    ADD COLUMN IF NOT EXISTS rules_approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS candidate_approval_required BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS identity_verification_required BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS otp_required BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS results_published_at TIMESTAMPTZ;

ALTER TABLE community_voting_eligibilities
    ADD COLUMN IF NOT EXISTS member_type VARCHAR(30),
    ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS identity_verified_by UUID,
    ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMPTZ;

ALTER TABLE community_voting_options
    ADD COLUMN IF NOT EXISTS candidate_user_id UUID,
    ADD COLUMN IF NOT EXISTS candidate_bio TEXT,
    ADD COLUMN IF NOT EXISTS candidate_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
    ADD COLUMN IF NOT EXISTS candidate_reviewed_by UUID,
    ADD COLUMN IF NOT EXISTS candidate_reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS candidate_rejection_reason TEXT;

-- Remove the identity-bearing ballot foreign key from vote choices. The
-- eligibility-to-ballot mapping remains separate from anonymous vote rows.
ALTER TABLE community_voting_votes DROP COLUMN IF EXISTS ballot_id;
ALTER TABLE community_voting_votes
    ADD COLUMN IF NOT EXISTS receipt_hash VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS community_voting_votes_receipt_hash_uq
    ON community_voting_votes (receipt_hash) WHERE receipt_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS community_voting_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voting_id UUID NOT NULL REFERENCES community_votings(id) ON DELETE CASCADE,
    eligibility_id UUID NOT NULL REFERENCES community_voting_eligibilities(id) ON DELETE CASCADE,
    code_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    attempts INTEGER NOT NULL DEFAULT 0,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_voting_otps_eligibility_idx
    ON community_voting_otps (eligibility_id, created_at DESC);

CREATE TABLE IF NOT EXISTS community_voting_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voting_id UUID NOT NULL REFERENCES community_votings(id) ON DELETE RESTRICT,
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE RESTRICT,
    actor_id UUID,
    action VARCHAR(60) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    previous_hash VARCHAR(64),
    event_hash VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_voting_audits_voting_idx
    ON community_voting_audits (voting_id, created_at, id);

CREATE OR REPLACE FUNCTION reject_community_voting_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Community voting audit events are append-only';
END;
$$;
DROP TRIGGER IF EXISTS community_voting_audits_immutable ON community_voting_audits;
CREATE TRIGGER community_voting_audits_immutable
    BEFORE UPDATE OR DELETE ON community_voting_audits
    FOR EACH ROW EXECUTE FUNCTION reject_community_voting_audit_mutation();
