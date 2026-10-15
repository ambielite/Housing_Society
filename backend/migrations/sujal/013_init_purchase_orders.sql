-- =====================================================================
-- Migration 013: Purchase Orders, Goods Receipts, Vendor Invoices,
-- Vendor Payments
-- Matches DB Architecture doc, Section 11 "Vendors & Procurement"
-- Depends on: societies(id), users(id), vendors(id), purchase_requests(id)
--
-- vendor_invoices.document_id: Document Vault now exists, but this
-- migration runs BEFORE migration 026 (where documents is created) -
-- an inline FK here would break a fresh install. Stays plain UUID
-- here; the real FK constraint is added via ALTER TABLE at the end of
-- migration 026.
--
-- Still-open placeholders (NOT touched - these belong to your
-- teammate's modules, out of scope per your instruction):
--   purchase_order_lines.asset_category_id -> Phase 11 (Assets, teammate)
--   vendor_payments.payment_id             -> Phase 7 (Payments, teammate)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- purchase_orders: id, society_id, vendor_id, purchase_request_id,
-- po_no (unique), po_date, delivery_date, subtotal, tax, total, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id            UUID NOT NULL REFERENCES societies(id),
  vendor_id             UUID NOT NULL REFERENCES vendors(id),
  purchase_request_id   UUID REFERENCES purchase_requests(id),
  po_no                 VARCHAR(50) NOT NULL UNIQUE,
  po_date               DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date         DATE,
  subtotal              NUMERIC(14, 2) NOT NULL DEFAULT 0,
  tax                   NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total                 NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status                VARCHAR(20) NOT NULL DEFAULT 'ISSUED',  -- ISSUED|AMENDED|RECEIVED|BILLED|PAID|CANCELLED
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- purchase_order_lines: id, purchase_order_id, item_description,
-- quantity, unit_price, tax, total, asset_category_id (placeholder)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_order_lines (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id   UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_description    VARCHAR(255) NOT NULL,
  quantity            NUMERIC(12, 2) NOT NULL,
  unit_price          NUMERIC(14, 2) NOT NULL,
  tax                 NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total               NUMERIC(14, 2) NOT NULL DEFAULT 0,
  asset_category_id   UUID  -- no FK yet: Phase 11 Assets not built (teammate's module)
);

-- ---------------------------------------------------------------------
-- goods_receipts: id, purchase_order_id, receipt_no (unique),
-- received_at, received_by, status
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS goods_receipts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id   UUID NOT NULL REFERENCES purchase_orders(id),
  receipt_no          VARCHAR(50) NOT NULL UNIQUE,
  received_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_by         UUID REFERENCES users(id),
  status              VARCHAR(20) NOT NULL DEFAULT 'ACCEPTED',  -- ACCEPTED|PARTIAL|REJECTED
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- goods_receipt_lines: id, goods_receipt_id, po_line_id, received_qty,
-- accepted_qty, rejected_qty
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS goods_receipt_lines (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goods_receipt_id  UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
  po_line_id        UUID NOT NULL REFERENCES purchase_order_lines(id),
  received_qty      NUMERIC(12, 2) NOT NULL,
  accepted_qty      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  rejected_qty      NUMERIC(12, 2) NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------
-- vendor_invoices: id, vendor_id, purchase_order_id, invoice_no,
-- invoice_date, due_date, subtotal, tax, total, status, document_id
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendor_invoices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id           UUID NOT NULL REFERENCES vendors(id),
  purchase_order_id   UUID REFERENCES purchase_orders(id),
  invoice_no          VARCHAR(50) NOT NULL,
  invoice_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date            DATE,
  subtotal            NUMERIC(14, 2) NOT NULL DEFAULT 0,
  tax                 NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total                NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',  -- DRAFT|VERIFIED|APPROVED|PAID|CANCELLED
  document_id         UUID,  -- FK to documents(id) added at the end of migration 026
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, invoice_no)
);

-- ---------------------------------------------------------------------
-- vendor_invoice_lines: id, vendor_invoice_id, po_line_id (nullable),
-- description, quantity, amount, tax
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendor_invoice_lines (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_invoice_id   UUID NOT NULL REFERENCES vendor_invoices(id) ON DELETE CASCADE,
  po_line_id          UUID REFERENCES purchase_order_lines(id),
  description         VARCHAR(255) NOT NULL,
  quantity            NUMERIC(12, 2) NOT NULL DEFAULT 1,
  amount              NUMERIC(14, 2) NOT NULL,
  tax                 NUMERIC(14, 2) NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------
-- vendor_payments: id, vendor_invoice_id, payment_id (placeholder),
-- allocated_amount
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendor_payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_invoice_id   UUID NOT NULL REFERENCES vendor_invoices(id),
  payment_id          UUID,  -- no FK yet: Phase 7 Payments not built (teammate's module)
  allocated_amount    NUMERIC(14, 2) NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_po_society               ON purchase_orders(society_id);
CREATE INDEX IF NOT EXISTS idx_po_vendor                ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_po_lines_po               ON purchase_order_lines(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipts_po         ON goods_receipts(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_grn_lines_receipt         ON goods_receipt_lines(goods_receipt_id);
CREATE INDEX IF NOT EXISTS idx_vendor_invoices_vendor    ON vendor_invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_invoices_po        ON vendor_invoices(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_vinvoice_lines_invoice    ON vendor_invoice_lines(vendor_invoice_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_invoice   ON vendor_payments(vendor_invoice_id);
