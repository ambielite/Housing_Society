CREATE TABLE IF NOT EXISTS agreement_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id UUID NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
    document_type VARCHAR(40) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(150) NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 20971520),
    content BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT agreement_documents_type_check
        CHECK (document_type IN ('agreementDocument', 'signedAgreementCopy')),
    CONSTRAINT agreement_documents_agreement_type_unique UNIQUE (agreement_id, document_type)
);

CREATE INDEX IF NOT EXISTS agreement_documents_agreement_idx
    ON agreement_documents (agreement_id);
