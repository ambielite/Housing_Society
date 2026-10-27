ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS document_storage_key VARCHAR(255),
  ADD COLUMN IF NOT EXISTS document_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS document_mime_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS document_size_bytes BIGINT;
