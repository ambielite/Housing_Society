-- Payment verification posts journals to these standard accounts. Seed them
-- for current societies and new societies so offline payments can be posted.
CREATE OR REPLACE FUNCTION public.ensure_finance_payment_accounts(target_society_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.accounts (
    society_id, account_code, account_name, account_type,
    is_control_account, is_system_account, is_active, description,
    created_at, updated_at
  ) VALUES
    (target_society_id, '1100', 'Cash on Hand', 'ASSET', false, true, true,
      'System account for cash payments', now(), now()),
    (target_society_id, '1200', 'Bank Account', 'ASSET', false, true, true,
      'System account for non-cash payments', now(), now()),
    (target_society_id, '1300', 'Accounts Receivable', 'RECEIVABLE', true, true, true,
      'System receivable account for payment postings', now(), now())
  ON CONFLICT (society_id, account_code) DO NOTHING;
END;
$$;

DO $$
DECLARE
  society_record RECORD;
BEGIN
  FOR society_record IN SELECT id FROM public.societies LOOP
    PERFORM public.ensure_finance_payment_accounts(society_record.id);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_finance_payment_accounts_for_society()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.ensure_finance_payment_accounts(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS societies_seed_finance_payment_accounts ON public.societies;
CREATE TRIGGER societies_seed_finance_payment_accounts
AFTER INSERT ON public.societies
FOR EACH ROW
EXECUTE FUNCTION public.create_finance_payment_accounts_for_society();
