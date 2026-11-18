DO $$ BEGIN
  CREATE TYPE public.enum_resident_kyc_documents_document_type AS ENUM (
    'AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID',
    'ADDRESS_PROOF', 'RENT_AGREEMENT', 'OWNERSHIP_PROOF',
    'POLICE_VERIFICATION', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.enum_resident_kyc_documents_verification_status AS ENUM (
    'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.enum_resident_kyc_documents_access_level AS ENUM (
    'PRIVATE', 'ADMIN_ONLY', 'VERIFICATION_TEAM', 'AUTHORIZED_STAFF'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.resident_kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  stakeholder_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  document_type public.enum_resident_kyc_documents_document_type NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  document_number VARCHAR(255),
  file_name VARCHAR(255),
  file_url TEXT,
  storage_key TEXT,
  mime_type VARCHAR(100),
  file_size BIGINT,
  checksum VARCHAR(255),
  is_encrypted BOOLEAN NOT NULL DEFAULT TRUE,
  issued_date DATE,
  expiry_date DATE,
  verification_status public.enum_resident_kyc_documents_verification_status NOT NULL DEFAULT 'PENDING',
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  verification_remarks TEXT,
  access_level public.enum_resident_kyc_documents_access_level NOT NULL DEFAULT 'ADMIN_ONLY',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  archived_at TIMESTAMPTZ,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resident_kyc_documents_society_idx
  ON public.resident_kyc_documents (society_id);
CREATE INDEX IF NOT EXISTS resident_kyc_documents_stakeholder_idx
  ON public.resident_kyc_documents (stakeholder_id);
CREATE INDEX IF NOT EXISTS resident_kyc_documents_type_idx
  ON public.resident_kyc_documents (document_type);
CREATE INDEX IF NOT EXISTS resident_kyc_documents_status_idx
  ON public.resident_kyc_documents (verification_status);
CREATE INDEX IF NOT EXISTS resident_kyc_documents_expiry_idx
  ON public.resident_kyc_documents (expiry_date);
