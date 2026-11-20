jest.mock('../src/config/db', () => ({ query: jest.fn(), pool: { end: jest.fn().mockResolvedValue(undefined) } }));
jest.mock('../src/config/database', () => ({ close: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../src/modules/financial/payment/payment.service', () => ({}));
jest.mock('../src/modules/resident-finance/residentFinance.service', () => ({}));
jest.mock('../src/modules/financial/invoice/invoice.document.service', () => ({}));

const { query } = require('../src/config/db');
const residentBillsService = require('../src/modules/resident-bills/resident-bills.service');

test('resident dues show Previous Balance without adding it to payable totals', async () => {
  query
    .mockResolvedValueOnce({ rows: [{
      society_id: 'society-a', society_name: 'Society A', currency: 'INR',
      resident_id: 'resident-a', display_name: 'Resident A',
      unit_id: 'unit-a', unit_number: 'A-101', tower_name: 'A', floor_name: '1',
    }] })
    .mockResolvedValueOnce({ rows: [{
      id: 'invoice-current', invoice_number: 'INV-CURRENT', billing_period: '2026-11',
      invoice_date: '2026-11-01', due_date: '2026-11-10', previous_balance: '2000.00',
      subtotal: '5000.00', tax_amount: '0.00', penalty_amount: '100.00',
      total_amount: '5100.00', paid_amount: '0.00', outstanding_amount: '5100.00',
      status: 'ISSUED', description: 'Maintenance', document_path: null,
    }] })
    .mockResolvedValueOnce({ rows: [{
      id: 'item-current', description: 'Maintenance', quantity: '1', rate: '5000.00',
      amount: '5000.00', tax_rate: '0.00', tax_amount: '0.00', total_amount: '5000.00',
      charge_category: 'MAINTENANCE', config_name: 'Maintenance',
    }, {
      id: 'item-penalty', description: 'Penalty', quantity: '1', rate: '100.00',
      amount: '100.00', tax_rate: '0.00', tax_amount: '0.00', total_amount: '100.00',
      charge_category: 'PENALTY', config_name: null,
    }] });

  const result = await residentBillsService.getOutstandingDues({ societyId: 'society-a', id: 'user-a' });

  expect(result.totalOutstanding).toBe(5100);
  expect(result.dues).toHaveLength(1);
  expect(result.dues[0]).toMatchObject({
    previousBalance: 2000,
    subtotal: 5000,
    penaltyAmount: 100,
    totalAmount: 5100,
    outstandingAmount: 5100,
  });
  expect(result.dues[0].items.map(({ description }) => description)).toEqual(['Maintenance', 'Penalty']);
  const invoiceReadSql = query.mock.calls[1][0];
  expect(invoiceReadSql).toContain('invoice_previous_balance_sources');
  expect(invoiceReadSql).toContain('src.outstanding_amount');
  expect(invoiceReadSql).toContain('src.billing_period <> i.billing_period');
  expect(invoiceReadSql).not.toContain('i.previous_balance');
});
