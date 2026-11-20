jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/modules/financial/invoice/invoice.model', () => ({
  findAll: jest.fn(),
}));
jest.mock('../src/modules/financial/invoice/invoicePreviousBalanceSource.model', () => ({
  findAll: jest.fn(),
}));

const sequelize = require('../src/config/database');
const Invoice = require('../src/modules/financial/invoice/invoice.model');
const Source = require('../src/modules/financial/invoice/invoicePreviousBalanceSource.model');
const service = require('../src/modules/financial/invoice/previousBalance.service');

beforeEach(() => jest.clearAllMocks());

test('live Previous Balance uses current open source outstanding and excludes same-period references', async () => {
  sequelize.query.mockResolvedValue([{ table_exists: true }]);
  Source.findAll.mockResolvedValue([
    { statementInvoiceId: 'statement', sourceInvoiceId: 'prior', amountAtStatement: '2000.00' },
    { statementInvoiceId: 'statement', sourceInvoiceId: 'same-period', amountAtStatement: '500.00' },
  ]);
  Invoice.findAll.mockResolvedValue([
    { id: 'prior', societyId: 'society', unitId: 'unit', billingPeriod: 'October 2026', invoiceNumber: 'OLD', status: 'PARTIALLY_PAID', outstandingAmount: '1250.00' },
    { id: 'same-period', societyId: 'society', unitId: 'unit', billingPeriod: 'November 2026', invoiceNumber: 'SAME', status: 'ISSUED', outstandingAmount: '500.00' },
  ]);

  const result = await service.getLivePreviousBalances([
    { id: 'statement', societyId: 'society', unitId: 'unit', billingPeriod: 'November 2026' },
  ]);

  expect(result.get('statement')).toMatchObject({
    amount: 1250,
    sources: [{ invoiceId: 'prior', amountAtStatement: 2000, outstandingAmount: 1250 }],
  });
});
