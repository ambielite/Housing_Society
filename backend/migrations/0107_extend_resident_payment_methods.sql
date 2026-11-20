ALTER TYPE "public"."enum_payments_payment_method" ADD VALUE IF NOT EXISTS 'UPI';
ALTER TYPE "public"."enum_payments_payment_method" ADD VALUE IF NOT EXISTS 'GOOGLE_PAY';
ALTER TYPE "public"."enum_payments_payment_method" ADD VALUE IF NOT EXISTS 'PHONEPE';
ALTER TYPE "public"."enum_payments_payment_method" ADD VALUE IF NOT EXISTS 'RUPAY_CARD';
