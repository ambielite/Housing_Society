-- These resident workflow models were present in the application but had no
-- SQL migrations, causing the verification and non-member pages to fail.
-- Keep this as a forward-only migration so applied migrations remain intact.

DO $$ BEGIN
  CREATE TYPE public.enum_resident_verifications_verification_type AS ENUM (
    'INITIAL_REGISTRATION',
    'KYC',
    'OWNER_VERIFICATION',
    'TENANT_VERIFICATION',
    'PROFILE_UPDATE',
    'DOCUMENT_REVERIFICATION'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.enum_resident_verifications_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'MORE_INFORMATION_REQUIRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.enum_non_members_member_type AS ENUM (
    'SHOP',
    'SERVICE_PROVIDER',
    'TUTOR',
    'COMMERCIAL_OCCUPANT',
    'DOMESTIC_WORKER',
    'CONTRACTOR',
    'VENDOR',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.enum_non_members_status AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED',
    'BLACKLISTED',
    'ARCHIVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.resident_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES public.societies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES public.residents(id) ON UPDATE CASCADE ON DELETE CASCADE,
  verification_type public.enum_resident_verifications_verification_type NOT NULL DEFAULT 'INITIAL_REGISTRATION',
  status public.enum_resident_verifications_status NOT NULL DEFAULT 'PENDING',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  rejection_reason TEXT,
  information_request TEXT,
  reviewer_remarks TEXT,
  submitted_documents JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resident_verifications_society_id_idx ON public.resident_verifications (society_id);
CREATE INDEX IF NOT EXISTS resident_verifications_resident_id_idx ON public.resident_verifications (resident_id);
CREATE INDEX IF NOT EXISTS resident_verifications_status_idx ON public.resident_verifications (status);
CREATE INDEX IF NOT EXISTS resident_verifications_verification_type_idx ON public.resident_verifications (verification_type);

CREATE TABLE IF NOT EXISTS public.non_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES public.societies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  member_type public.enum_non_members_member_type NOT NULL,
  name VARCHAR(150) NOT NULL,
  organization_name VARCHAR(200),
  business_name VARCHAR(200),
  email VARCHAR(150),
  mobile VARCHAR(20) NOT NULL,
  alternate_mobile VARCHAR(20),
  emergency_contact_name VARCHAR(150),
  emergency_contact_mobile VARCHAR(20),
  address TEXT,
  unit_id UUID REFERENCES public.units(id) ON UPDATE CASCADE ON DELETE SET NULL,
  shop_number VARCHAR(50),
  service_description TEXT,
  identity_document_type VARCHAR(50),
  identity_document_number VARCHAR(100),
  status public.enum_non_members_status NOT NULL DEFAULT 'PENDING',
  start_date DATE,
  end_date DATE,
  approved_by UUID REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  remarks TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS non_members_society_id_idx ON public.non_members (society_id);
CREATE INDEX IF NOT EXISTS non_members_member_type_idx ON public.non_members (member_type);
CREATE INDEX IF NOT EXISTS non_members_status_idx ON public.non_members (status);
CREATE INDEX IF NOT EXISTS non_members_mobile_idx ON public.non_members (mobile);
CREATE INDEX IF NOT EXISTS non_members_unit_id_idx ON public.non_members (unit_id);
