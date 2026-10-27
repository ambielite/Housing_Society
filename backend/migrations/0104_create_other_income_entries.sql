CREATE TABLE IF NOT EXISTS other_income_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  accounting_period_id UUID NOT NULL REFERENCES accounting_periods(id),
  bank_account_id UUID REFERENCES society_bank_accounts(id),
  journal_id UUID NOT NULL UNIQUE REFERENCES journals(id),
  category VARCHAR(80) NOT NULL,
  payer_name VARCHAR(160) NOT NULL,
  description TEXT,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  received_date DATE NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH','BANK_TRANSFER','UPI','CHEQUE','OTHER')),
  reference_number VARCHAR(120),
  receipt_number VARCHAR(40) NOT NULL UNIQUE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_other_income_society_date ON other_income_entries (society_id, received_date DESC);

INSERT INTO accounts (society_id, account_code, account_name, account_type, is_control_account, is_system_account, is_active, description, created_at, updated_at)
SELECT id, '4200', 'Other Income', 'INCOME', false, true, true, 'System income account for non-maintenance society receipts', now(), now()
FROM societies
ON CONFLICT (society_id, account_code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.ensure_finance_other_income_account(target_society_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.accounts (society_id, account_code, account_name, account_type, is_control_account, is_system_account, is_active, description, created_at, updated_at)
  VALUES (target_society_id, '4200', 'Other Income', 'INCOME', false, true, true, 'System income account for non-maintenance society receipts', now(), now())
  ON CONFLICT (society_id, account_code) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_finance_other_income_account_for_society()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.ensure_finance_other_income_account(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS societies_seed_finance_other_income_account ON public.societies;
CREATE TRIGGER societies_seed_finance_other_income_account
AFTER INSERT ON public.societies
FOR EACH ROW EXECUTE FUNCTION public.create_finance_other_income_account_for_society();

INSERT INTO permissions (code, name, module, action, description) VALUES
  ('OTHER_INCOME_CREATE', 'Record other income', 'OTHER_INCOME', 'CREATE', 'Record non-maintenance income received by the society'),
  ('OTHER_INCOME_READ', 'View other income', 'OTHER_INCOME', 'READ', 'View non-maintenance society income records')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.society_id IS NULL AND r.code IN ('SUPER_ADMIN','SOCIETY_ADMIN','TREASURER','ACCOUNTANT') AND p.module = 'OTHER_INCOME'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.society_id IS NULL AND r.code IN ('PRESIDENT_SECRETARY','AUDITOR','VIEW_ONLY') AND p.code = 'OTHER_INCOME_READ'
ON CONFLICT DO NOTHING;
