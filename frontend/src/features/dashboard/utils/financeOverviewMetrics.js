const PAYABLE_BILL_STATUSES = new Set(['ISSUED', 'PARTIALLY_PAID', 'OVERDUE']);
const RECEIVED_PAYMENT_STATUSES = new Set(['SUCCESS', 'VERIFIED']);

const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const statusOf = (record) => String(record?.status || '').toUpperCase();

const outstandingOf = (bill) => {
  const authoritative = bill.outstandingAmount ?? bill.outstanding_amount;
  const amount = authoritative ?? (
    number(bill.totalAmount ?? bill.total_amount) - number(bill.paidAmount ?? bill.paid_amount)
  );
  return Math.max(number(amount), 0);
};

export const calculateFinancialOverview = ({ bills = [], payments = [], today }) => {
  const payableBills = bills.filter((bill) => PAYABLE_BILL_STATUSES.has(statusOf(bill)));
  const outstanding = payableBills.reduce((total, bill) => total + outstandingOf(bill), 0);
  const overdue = payableBills.filter((bill) => {
    const dueDate = bill.dueDate ?? bill.due_date;
    return outstandingOf(bill) > 0 && dueDate && String(dueDate).slice(0, 10) < today;
  }).length;
  const received = payments.reduce((total, payment) => (
    RECEIVED_PAYMENT_STATUSES.has(statusOf(payment))
      ? total + number(payment.amount ?? payment.amount_paid)
      : total
  ), 0);

  return {
    outstanding,
    overdue,
    received,
    // The UI label is “Billing records”; preserve its existing all-record meaning.
    billCount: bills.length,
    paymentCount: payments.length,
  };
};

