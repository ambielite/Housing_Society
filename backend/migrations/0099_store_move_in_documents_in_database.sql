CREATE TABLE IF NOT EXISTS move_in_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    move_in_id UUID NOT NULL REFERENCES move_ins(id) ON DELETE CASCADE,
    document_type VARCHAR(40) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(150) NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 20971520),
    content BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT move_in_documents_type_check
        CHECK (document_type IN ('leaseDocument', 'registryDocument', 'policeVerificationDocument')),
    CONSTRAINT move_in_documents_move_in_type_unique UNIQUE (move_in_id, document_type)
);

CREATE INDEX IF NOT EXISTS move_in_documents_move_in_idx
    ON move_in_documents (move_in_id);
