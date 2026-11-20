const { query } = require('../../config/db');
const ApiError = require('../../common/ApiError');
const ResidentFinanceService = require('../resident-finance/residentFinance.service');
const InvoiceDocumentService = require('../financial/invoice/invoice.document.service');

const resolveResidentContext = async (user) => {
  const societyId = user.societyId;
  if (!societyId) {
    throw new ApiError(400, 'User is not assigned to an active society');
  }

  const result = await query(
    `SELECT s.id AS society_id, s.name AS society_name, s.currency,
            s.logo_url AS society_logo_url, s.address AS society_address,
            s.email AS society_email, s.phone AS society_phone,
            r.id AS resident_id, r.display_name, r.first_name, r.last_name, r.email, r.mobile,
            t.name AS tower_name, f.name AS floor_name, u.id AS unit_id, u.unit_number
       FROM societies s
       LEFT JOIN residents r
         ON r.society_id = s.id
        AND r.user_id = $2
        AND r.status = 'ACTIVE'
       LEFT JOIN owner_units ou
         ON ou.owner_id = r.id AND ou.society_id = s.id AND ou.status = 'ACTIVE'
        AND (ou.effective_to IS NULL OR ou.effective_to >= CURRENT_DATE)
       LEFT JOIN units u ON u.id = ou.unit_id
       LEFT JOIN floors f ON f.id = u.floor_id
       LEFT JOIN towers t ON t.id = f.tower_id
      WHERE s.id = $1
      ORDER BY ou.effective_from DESC NULLS LAST
      LIMIT 1`,
    [societyId, user.id]
  );

  return result.rows[0] || null;
};

const getDuesSummary = async (user) => {
  const context = await resolveResidentContext(user);
  if (!context || !context.unit_id) {
    return {
      society: null,
      resident: null,
      unit: null,
      totalOutstanding: 0,
      pendingDuesCount: 0,
      nextDueDate: null,
      currency: 'INR',
    };
  }

  const duesSummaryResult = await query(
    `SELECT COALESCE(SUM(i.outstanding_amount), 0) AS total_outstanding,
            COUNT(i.id) AS pending_dues_count,
            MIN(to_char(i.due_date, 'YYYY-MM-DD')) AS next_due_date
       FROM invoices i
       JOIN owner_units ou ON ou.unit_id = i.unit_id
      WHERE ou.owner_id = $1 AND ou.society_id = $2 AND ou.status = 'ACTIVE'
        AND (ou.effective_to IS NULL OR ou.effective_to >= CURRENT_DATE)
        AND i.society_id = $2
        AND i.outstanding_amount > 0
        AND i.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')`,
    [context.resident_id, context.society_id]
  );

  const row = duesSummaryResult.rows[0];

  return {
    society: {
      id: context.society_id,
      name: context.society_name,
      currency: context.currency || 'INR',
      address: context.society_address,
      logoUrl: context.society_logo_url,
    },
    resident: {
      id: context.resident_id,
      name: context.display_name || `${context.first_name || ''} ${context.last_name || ''}`.trim(),
    },
    unit: {
      id: context.unit_id,
      number: context.unit_number,
      tower: context.tower_name,
      floor: context.floor_name,
    },
    currency: context.currency || 'INR',
    totalOutstanding: Number(row?.total_outstanding || 0),
    pendingDuesCount: Number(row?.pending_dues_count || 0),
    nextDueDate: row?.next_due_date || null,
  };
};

const getOutstandingDues = async (user) => {
  const context = await resolveResidentContext(user);
  if (!context || !context.unit_id) {
    return {
      unit: null,
      currency: 'INR',
      totalOutstanding: 0,
      dues: [],
    };
  }

  const invoicesResult = await query(
    `SELECT i.id, i.invoice_number, i.billing_period,
            to_char(i.invoice_date, 'YYYY-MM-DD') AS invoice_date,
            to_char(i.due_date, 'YYYY-MM-DD') AS due_date,
            COALESCE((
              SELECT SUM(src.outstanding_amount)
                FROM invoice_previous_balance_sources pbs
                JOIN invoices src ON src.id = pbs.source_invoice_id
               WHERE pbs.statement_invoice_id = i.id
                 AND src.society_id = i.society_id
                 AND src.unit_id = i.unit_id
                 AND src.billing_period <> i.billing_period
                 AND src.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')
                 AND src.outstanding_amount > 0
            ), 0) AS previous_balance,
            i.subtotal, i.tax_amount, i.penalty_amount,
            i.total_amount, i.paid_amount, i.outstanding_amount,
            i.status, i.description, i.document_path, i.billing_id
       FROM invoices i
       JOIN owner_units ou ON ou.unit_id = i.unit_id
      WHERE ou.owner_id = $1 AND ou.society_id = $2 AND ou.status = 'ACTIVE'
        AND (ou.effective_to IS NULL OR ou.effective_to >= CURRENT_DATE)
        AND i.society_id = $2
        AND i.outstanding_amount > 0
        AND i.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')
      ORDER BY i.due_date ASC, i.created_at ASC`,
    [context.resident_id, context.society_id]
  );

  const dues = [];
  let totalOutstanding = 0;

  for (const inv of invoicesResult.rows) {
    const outstanding = Number(inv.outstanding_amount || 0);
    totalOutstanding += outstanding;

    const itemsResult = await query(
      `SELECT ii.id, ii.description, ii.quantity, ii.rate,
              ii.amount, ii.tax_rate, ii.tax_amount, ii.total_amount,
              COALESCE(bc.charge_category, 'MAINTENANCE') AS charge_category,
              bc.name AS config_name
         FROM invoice_items ii
         LEFT JOIN billing_configs bc ON bc.id = ii.billing_config_id
        WHERE ii.invoice_id = $1
        ORDER BY ii.created_at ASC`,
      [inv.id]
    );

    let items = itemsResult.rows.map((item) => ({
      id: item.id,
      description: item.description,
      amount: Number(item.amount || 0),
      quantity: Number(item.quantity || 1),
      rate: Number(item.rate || item.amount || 0),
      taxAmount: Number(item.tax_amount || 0),
      totalAmount: Number(item.total_amount || item.amount || 0),
      chargeCategory: item.charge_category || 'MAINTENANCE',
    }));

    if (items.length === 0) {
      items = [
        {
          id: `${inv.id}-main`,
          description: inv.description || 'Maintenance Charges',
          amount: Number(inv.subtotal || inv.total_amount || 0),
          quantity: 1,
          rate: Number(inv.subtotal || inv.total_amount || 0),
          taxAmount: Number(inv.tax_amount || 0),
          totalAmount: Number(inv.subtotal || inv.total_amount || 0),
          chargeCategory: 'MAINTENANCE',
        },
      ];
      if (Number(inv.tax_amount || 0) > 0) {
        items.push({
          id: `${inv.id}-tax`,
          description: 'Applicable Taxes',
          amount: Number(inv.tax_amount),
          quantity: 1,
          rate: Number(inv.tax_amount),
          taxAmount: 0,
          totalAmount: Number(inv.tax_amount),
          chargeCategory: 'TAX',
        });
      }
      if (Number(inv.penalty_amount || 0) > 0) {
        items.push({
          id: `${inv.id}-penalty`,
          description: 'Late Fee / Penalty',
          amount: Number(inv.penalty_amount),
          quantity: 1,
          rate: Number(inv.penalty_amount),
          taxAmount: 0,
          totalAmount: Number(inv.penalty_amount),
          chargeCategory: 'PENALTY',
        });
      }
    }

    dues.push({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      billingPeriod: inv.billing_period,
      invoiceDate: inv.invoice_date,
      dueDate: inv.due_date,
      previousBalance: Number(inv.previous_balance || 0),
      subtotal: Number(inv.subtotal || 0),
      taxAmount: Number(inv.tax_amount || 0),
      penaltyAmount: Number(inv.penalty_amount || 0),
      totalAmount: Number(inv.total_amount || 0),
      paidAmount: Number(inv.paid_amount || 0),
      outstandingAmount: outstanding,
      status: inv.status,
      description: inv.description,
      hasDocument: Boolean(inv.document_path),
      items,
    });
  }

  return {
    unit: {
      id: context.unit_id,
      number: context.unit_number,
      tower: context.tower_name,
      floor: context.floor_name,
    },
    currency: context.currency || 'INR',
    totalOutstanding,
    dues,
  };
};

const getPaymentHistory = async (user) => {
  const context = await resolveResidentContext(user);
  if (!context || !context.unit_id) {
    return {
      payments: [],
    };
  }

  const paymentsResult = await query(
    `SELECT p.id, p.payment_reference, p.payment_method, p.payment_channel,
            p.amount, to_char(p.payment_date, 'YYYY-MM-DD') AS payment_date,
            p.status, p.gateway_name, p.gateway_order_id, p.gateway_transaction_id,
            p.receipt_number, p.verification_remarks, p.verified_at,
            p.remarks, p.metadata, p.created_at,
            i.id AS invoice_id, i.invoice_number, i.billing_period,
            i.description AS invoice_description
       FROM payments p
       LEFT JOIN invoices i ON i.id = p.invoice_id
      WHERE p.society_id = $1
        AND p.member_id = $2
      ORDER BY p.created_at DESC`,
    [context.society_id, context.resident_id]
  );

  const payments = paymentsResult.rows.map((row) => ({
    id: row.id,
    paymentReference: row.payment_reference,
    receiptNumber: row.receipt_number,
    paymentMethod: row.payment_method,
    paymentChannel: row.payment_channel,
    amount: Number(row.amount || 0),
    paymentDate: row.payment_date,
    status: row.status,
    gatewayName: row.gateway_name,
    gatewayOrderId: row.gateway_order_id,
    gatewayTransactionId: row.gateway_transaction_id,
    verificationRemarks: row.verification_remarks,
    verifiedAt: row.verified_at,
    remarks: row.remarks,
    invoiceId: row.invoice_id,
    invoiceNumber: row.invoice_number,
    billingPeriod: row.billing_period,
    invoiceDescription: row.invoice_description,
    createdAt: row.created_at,
    selectedMethod: row.metadata?.selectedMethod || row.payment_method,
  }));

  return { payments };
};

const getBankDetails = async (user) => {
  const societyId = user.societyId;
  if (!societyId) return { bankAccounts: [] };

  const bankResult = await query(
    `SELECT id, bank_name, account_holder_name, account_number,
            account_type, ifsc, branch_name, upi_id, is_primary
       FROM society_bank_accounts
      WHERE society_id = $1 AND is_active = true
      ORDER BY is_primary DESC, created_at ASC`,
    [societyId]
  );

  return { bankAccounts: bankResult.rows };
};

const initiatePayment = async (user, data) => {
  const context = await resolveResidentContext(user);
  if (!context || !context.unit_id) {
    throw new ApiError(400, 'Resident has no active unit assignment in this society');
  }

  const { invoiceId, paymentMethod = 'UPI', remarks } = data;
  if (!invoiceId) {
    throw new ApiError(400, 'invoiceId is required');
  }

  const normalizedMethod = String(paymentMethod).trim().toUpperCase();
  const idempotencyKey = data.idempotencyKey || `RES-PAY-${invoiceId}-${Date.now()}`;
  const financeResult = await ResidentFinanceService.initiatePayment(user, {
    invoiceId,
    method: normalizedMethod,
    idempotencyKey,
    amount: data.amount,
    remarks,
  });
  const payment = financeResult.payment.toJSON
    ? financeResult.payment.toJSON()
    : financeResult.payment;
  const isOffline = payment.paymentChannel === 'OFFLINE';

  return {
    status: payment.status,
    duplicate: financeResult.duplicate,
    payment: {
      id: payment.id,
      paymentReference: payment.paymentReference,
      gatewayOrderId: payment.gatewayOrderId,
      amount: Number(payment.amount),
      status: payment.status,
      paymentMethod: normalizedMethod,
      paymentChannel: payment.paymentChannel,
      invoiceNumber: financeResult.invoiceNumber || null,
      billingPeriod: financeResult.billingPeriod || null,
    },
    message: isOffline
      ? 'Offline payment request recorded for verification.'
      : financeResult.duplicate
        ? 'Existing payment request returned.'
        : 'Payment initiated. Proceed to the configured payment provider.',
  };
};
const confirmOnlinePayment = async (user, paymentId, confirmationData = {}) => {
  const context = await resolveResidentContext(user);
  if (!context) {
    throw new ApiError(400, 'Resident context not found');
  }

  const paymentResult = await query(
    `SELECT p.id, p.status, p.journal_id
       FROM payments p
      WHERE p.id = $1 AND p.society_id = $2 AND p.member_id = $3`,
    [paymentId, context.society_id, context.resident_id]
  );

  const payment = paymentResult.rows[0];
  if (!payment) {
    throw new ApiError(404, 'Payment transaction not found');
  }

  if (['SUCCESS', 'VERIFIED'].includes(payment.status) && payment.journal_id) {
    return {
      status: payment.status,
      duplicate: true,
      payment,
      message: 'Payment has already been confirmed and processed.',
    };
  }

  if (['SUCCESS', 'VERIFIED'].includes(payment.status)) {
    throw new ApiError(409, 'Payment is marked complete but has no accounting Journal');
  }

  const serviceResult = await ResidentFinanceService.verifyRazorpayPayment(
    user,
    payment.id,
    confirmationData,
  );

  const resultStatus = serviceResult.payment?.status || serviceResult.status;
  const completed = ['SUCCESS', 'VERIFIED'].includes(resultStatus)
    && Boolean(serviceResult.payment?.journalId);

  if (['SUCCESS', 'VERIFIED'].includes(resultStatus) && !completed) {
    throw new ApiError(409, 'Payment completion returned without a posted accounting Journal');
  }

  return {
    status: resultStatus,
    duplicate: serviceResult.duplicate || false,
    payment: serviceResult.payment,
    message: completed
      ? 'Payment completed successfully. Receipt has been generated.'
      : 'Provider payment status was recorded.',
  };
};

const cancelPayment = async (user, paymentId, remarks) => {
  const context = await resolveResidentContext(user);
  if (!context) {
    throw new ApiError(400, 'Resident context not found');
  }

  const paymentResult = await query(
    `SELECT id, status FROM payments
      WHERE id = $1 AND society_id = $2 AND member_id = $3`,
    [paymentId, context.society_id, context.resident_id]
  );

  const payment = paymentResult.rows[0];
  if (!payment) {
    throw new ApiError(404, 'Payment transaction not found');
  }

  if (['SUCCESS', 'VERIFIED', 'REFUNDED'].includes(payment.status)) {
    throw new ApiError(409, 'Completed payments cannot be cancelled directly');
  }

  if (!['INITIATED', 'PENDING', 'VERIFICATION_PENDING'].includes(payment.status)) {
    throw new ApiError(409, `Payment cannot be cancelled from status ${payment.status}`);
  }

  const updatedResult = await query(
    `UPDATE payments
        SET status = 'CANCELLED',
            remarks = COALESCE($1, 'Cancelled by resident'),
            updated_at = NOW()
      WHERE id = $2 AND society_id = $3 AND member_id = $4
        AND status IN ('INITIATED', 'PENDING', 'VERIFICATION_PENDING')
      RETURNING id, status`,
    [remarks, payment.id, context.society_id, context.resident_id]
  );

  if (!updatedResult.rowCount) {
    throw new ApiError(409, 'Payment can no longer be cancelled');
  }

  return { id: updatedResult.rows[0].id, status: updatedResult.rows[0].status };
};

const downloadInvoiceDocument = async (user, invoiceId) => {
  const context = await resolveResidentContext(user);
  if (!context || !context.unit_id) {
    throw new ApiError(400, 'Resident has no active unit');
  }

  const invoiceCheck = await query(
    `SELECT id FROM invoices WHERE id = $1 AND society_id = $2 AND unit_id = $3`,
    [invoiceId, context.society_id, context.unit_id]
  );

  if (invoiceCheck.rowCount === 0) {
    throw new ApiError(404, 'Invoice not found or access denied');
  }

  return await InvoiceDocumentService.getInvoiceDocumentPath(invoiceId);
};

const getReceiptDetails = async (user, paymentId) => {
  const context = await resolveResidentContext(user);
  if (!context) {
    throw new ApiError(400, 'Resident context not found');
  }

  const result = await query(
    `SELECT p.id, p.payment_reference, p.payment_method, p.payment_channel,
            p.amount, to_char(p.payment_date, 'YYYY-MM-DD') AS payment_date,
            p.status, p.gateway_name, p.gateway_order_id, p.gateway_transaction_id,
            p.receipt_number, p.verification_remarks, p.verified_at,
            p.created_at, p.metadata,
            i.id AS invoice_id, i.invoice_number, i.billing_period,
            i.description AS invoice_description,
            s.name AS society_name, s.address AS society_address, s.currency,
            u.unit_number, t.name AS tower_name
       FROM payments p
       LEFT JOIN invoices i ON i.id = p.invoice_id
       LEFT JOIN societies s ON s.id = p.society_id
       LEFT JOIN units u ON u.id = p.unit_id
       LEFT JOIN floors f ON f.id = u.floor_id
       LEFT JOIN towers t ON t.id = f.tower_id
      WHERE p.id = $1 AND p.society_id = $2 AND p.member_id = $3`,
    [paymentId, context.society_id, context.resident_id]
  );

  const receipt = result.rows[0];
  if (!receipt) {
    throw new ApiError(404, 'Payment record not found');
  }

  return {
    ...receipt,
    amount: Number(receipt.amount || 0),
    currency: receipt.currency || 'INR',
    selectedMethod: receipt.metadata?.selectedMethod || receipt.payment_method,
  };
};

module.exports = {
  getDuesSummary,
  getOutstandingDues,
  getPaymentHistory,
  getBankDetails,
  initiatePayment,
  confirmOnlinePayment,
  cancelPayment,
  downloadInvoiceDocument,
  getReceiptDetails,
};

