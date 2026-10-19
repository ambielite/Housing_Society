-- Connect Sujal module placeholders to their now-existing module tables.
-- These fields are optional; dangling historical UUIDs were only placeholders,
-- so clear those references before enforcing the real relationships.

UPDATE purchase_request_lines prl
SET asset_category_id = NULL
WHERE asset_category_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM asset_categories ac WHERE ac.id = prl.asset_category_id);

UPDATE purchase_order_lines pol
SET asset_category_id = NULL
WHERE asset_category_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM asset_categories ac WHERE ac.id = pol.asset_category_id);

UPDATE purchase_request_lines prl
SET asset_category_id = NULL
FROM purchase_requests pr, asset_categories ac
WHERE prl.purchase_request_id = pr.id
  AND ac.id = prl.asset_category_id
  AND ac.society_id <> pr.society_id;

UPDATE purchase_order_lines pol
SET asset_category_id = NULL
FROM purchase_orders po, asset_categories ac
WHERE pol.purchase_order_id = po.id
  AND ac.id = pol.asset_category_id
  AND ac.society_id <> po.society_id;

UPDATE amenity_bookings ab
SET payment_id = NULL
WHERE payment_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.id = ab.payment_id);

UPDATE amenity_bookings ab
SET payment_id = NULL
FROM amenity_slots als, amenities a, payments p
WHERE als.id = ab.amenity_slot_id
  AND a.id = als.amenity_id
  AND p.id = ab.payment_id
  AND p.society_id <> a.society_id;

UPDATE vendor_payments vp
SET payment_id = NULL
WHERE payment_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.id = vp.payment_id);

UPDATE vendor_payments vp
SET payment_id = NULL
FROM vendor_invoices vi, vendors v, payments p
WHERE vi.id = vp.vendor_invoice_id
  AND v.id = vi.vendor_id
  AND p.id = vp.payment_id
  AND p.society_id <> v.society_id;

UPDATE utility_bills ub
SET invoice_line_id = NULL
WHERE invoice_line_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM invoice_items ii WHERE ii.id = ub.invoice_line_id);

UPDATE utility_bills ub
SET invoice_line_id = NULL
FROM meters m, invoice_items ii, invoices i
WHERE m.id = ub.meter_id
  AND ii.id = ub.invoice_line_id
  AND i.id = ii.invoice_id
  AND i.society_id <> m.society_id;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_request_lines_asset_category_id_fkey') THEN
    ALTER TABLE purchase_request_lines
      ADD CONSTRAINT purchase_request_lines_asset_category_id_fkey
      FOREIGN KEY (asset_category_id) REFERENCES asset_categories(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_order_lines_asset_category_id_fkey') THEN
    ALTER TABLE purchase_order_lines
      ADD CONSTRAINT purchase_order_lines_asset_category_id_fkey
      FOREIGN KEY (asset_category_id) REFERENCES asset_categories(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'amenity_bookings_payment_id_fkey') THEN
    ALTER TABLE amenity_bookings
      ADD CONSTRAINT amenity_bookings_payment_id_fkey
      FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vendor_payments_payment_id_fkey') THEN
    ALTER TABLE vendor_payments
      ADD CONSTRAINT vendor_payments_payment_id_fkey
      FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'utility_bills_invoice_line_id_fkey') THEN
    ALTER TABLE utility_bills
      ADD CONSTRAINT utility_bills_invoice_line_id_fkey
      FOREIGN KEY (invoice_line_id) REFERENCES invoice_items(id) ON DELETE SET NULL;
  END IF;
END $$;
