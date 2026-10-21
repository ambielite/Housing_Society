-- Billing issue posts maintenance charges to account 4100. Ensure this
-- standard income account exists for current and newly created societies.
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
      'System receivable account for payment postings', now(), now()),
    (target_society_id, '4100', 'Maintenance Income', 'INCOME', false, true, true,
      'System income account for maintenance billing', now(), now())
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
