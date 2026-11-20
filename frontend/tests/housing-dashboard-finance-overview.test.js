import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFinancialOverview } from '../src/features/dashboard/utils/financeOverviewMetrics.js';

const today = '2026-11-19';
const summarizeBills = (bills) => calculateFinancialOverview({ bills, today }).outstanding;

test('draft and cancelled positive balances are excluded from outstanding and past due', () => {
  const result = calculateFinancialOverview({
    bills: [
      { status: 'DRAFT', outstandingAmount: 40, dueDate: '2026-11-01' },
      { status: 'CANCELLED', outstandingAmount: 80, dueDate: '2026-11-01' },
    ],
    today,
  });
  assert.equal(result.outstanding, 0);
  assert.equal(result.overdue, 0);
  assert.equal(result.billCount, 2);
});

test('issued unpaid and partially paid bills contribute their authoritative outstanding amount', () => {
  assert.equal(summarizeBills([
    { status: 'ISSUED', totalAmount: 100, paidAmount: 0, outstandingAmount: 100 },
    { status: 'PARTIALLY_PAID', totalAmount: 100, paidAmount: 25, outstandingAmount: 75 },
  ]), 175);
});

test('eligible outstanding falls back to total minus paid only when outstandingAmount is absent', () => {
  assert.equal(summarizeBills([
    { status: 'ISSUED', totalAmount: 50, paidAmount: 10 },
  ]), 40);
});

test('fully paid and other non-payable statuses do not contribute', () => {
  assert.equal(summarizeBills([
    { status: 'PAID', outstandingAmount: 0, totalAmount: 90 },
    { status: 'DRAFT', outstandingAmount: 20 },
    { status: 'CANCELLED', outstandingAmount: 30 },
  ]), 0);
});

test('past due requires an eligible bill, positive balance, and due date before today', () => {
  const result = calculateFinancialOverview({
    bills: [
      { status: 'ISSUED', outstandingAmount: 30, dueDate: '2026-11-18' },
      { status: 'PARTIALLY_PAID', outstandingAmount: 10, dueDate: '2026-11-20' },
      { status: 'OVERDUE', outstandingAmount: 0, dueDate: '2026-11-01' },
      { status: 'PAID', outstandingAmount: 2, dueDate: '2026-11-01' },
    ],
    today,
  });
  assert.equal(result.overdue, 1);
});

test('payments received includes successful online and verified offline only', () => {
  const result = calculateFinancialOverview({
    payments: [
      { status: 'SUCCESS', paymentChannel: 'GATEWAY', amount: 100 },
      { status: 'VERIFIED', paymentChannel: 'OFFLINE', amount: 25 },
      { status: 'PENDING', amount: 300 },
      { status: 'FAILED', amount: 400 },
      { status: 'CANCELLED', amount: 500 },
      { status: 'REFUNDED', amount: 600 },
    ],
  });
  assert.equal(result.received, 125);
  assert.equal(result.paymentCount, 6);
});

test('previousBalance is not added separately and billing-record count retains all records', () => {
  const result = calculateFinancialOverview({
    bills: [
      { status: 'ISSUED', outstandingAmount: 100, previousBalance: 60 },
      { status: 'DRAFT', outstandingAmount: 20, previousBalance: 5 },
    ],
    today,
  });
  assert.equal(result.outstanding, 100);
  assert.equal(result.billCount, 2);
});
