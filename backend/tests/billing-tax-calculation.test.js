jest.mock("../src/config/database", () => ({ transaction: jest.fn(), close: jest.fn() }));
jest.mock("../src/modules/financial/billing/billing.repository", () => ({
    findByBillNumber: jest.fn(),
    findOutstandingByUnit: jest.fn(),
    create: jest.fn()
}));
jest.mock("../src/modules/financial/billing-config/billingConfig.model", () => ({ findOne: jest.fn() }));
jest.mock("../src/modules/financial/ledger-account/ledgerAccount.model", () => ({ findOne: jest.fn() }));
jest.mock("../src/modules/financial/account/account.model", () => ({ findOne: jest.fn() }));
jest.mock("../src/modules/financial/accounting-period/accountingPeriod.model", () => ({}));
jest.mock("../src/modules/financial/journal/journal.model", () => ({}));
jest.mock("../src/modules/financial/journal/journalLine.model", () => ({}));
jest.mock("../src/modules/financial/invoice/invoice.service", () => ({}));
jest.mock("../src/modules/financial/invoice/invoice.repository", () => ({ findOutstandingByUnit: jest.fn().mockResolvedValue([]) }));
jest.mock("../src/modules/financial/invoice/invoice.model", () => ({}));
jest.mock("../src/modules/financial/invoice/previousBalance.service", () => ({ hasSourceTable: jest.fn() }));
jest.mock("../src/modules/financial/tax/tax.model", () => ({ findAll: jest.fn() }));

const { Op } = require("sequelize");
const repository = require("../src/modules/financial/billing/billing.repository");
const BillingConfig = require("../src/modules/financial/billing-config/billingConfig.model");
const LedgerAccount = require("../src/modules/financial/ledger-account/ledgerAccount.model");
const Account = require("../src/modules/financial/account/account.model");
const InvoiceRepository = require("../src/modules/financial/invoice/invoice.repository");
const Tax = require("../src/modules/financial/tax/tax.model");
const billingService = require("../src/modules/financial/billing/billing.service");

const societyA = "society-a";
const rule = (overrides = {}) => ({
    id: "tax-a",
    societyId: societyA,
    taxCode: "GST-MNT-18",
    taxName: "Maintenance GST 18%",
    taxType: "GST",
    taxRate: "18.0000",
    calculationMethod: "PERCENTAGE",
    fixedAmount: null,
    applicableOn: "INVOICE",
    isActive: true,
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
    ...overrides
});

const billInput = {
    societyId: societyA,
    unitId: "unit-a",
    billingRuleCode: "BR-MNT-001",
    billDate: "2026-11-16",
    unitArea: 100
};

beforeEach(() => {
    jest.clearAllMocks();
    const rules = [];
    Tax.findAll.mockImplementation(async ({ where }) => {
        const effectiveDate = where.effectiveFrom[Op.lte];
        const effectiveToConditions = where[Op.or];
        return rules.filter((tax) => tax.societyId === where.societyId
            && tax.isActive === where.isActive
            && tax.effectiveFrom <= effectiveDate
            && effectiveToConditions.some((condition) => (
                condition.effectiveTo === null
                    ? tax.effectiveTo === null
                    : tax.effectiveTo !== null && tax.effectiveTo >= condition.effectiveTo[Op.gte]
            )));
    });
    Tax.__setRules = (nextRules) => rules.push(...nextRules);

    repository.findOutstandingByUnit.mockResolvedValue([]);
    repository.findByBillNumber.mockResolvedValue(null);
    repository.create.mockImplementation(async (data) => data);
    BillingConfig.findOne.mockResolvedValue({
        id: "billing-rule-a",
        billingModel: "FLAT_RATE",
        chargeCategory: "MAINTENANCE",
        code: "BR-MNT-001",
        flatAmount: "5000.00"
    });
    LedgerAccount.findOne.mockResolvedValue({ id: "ledger-a", accountId: "account-a" });
    Account.findOne.mockResolvedValue({ id: "account-a", accountType: "RECEIVABLE" });
});

test("active invoice-scoped 18% GST taxes the maintenance charge only", async () => {
    Tax.__setRules([rule()]);
    const result = await billingService.calculateCompleteBilling(billInput);

    expect(Tax.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ societyId: societyA, isActive: true })
    }));
    expect(result).toMatchObject({ subtotal: 5000, taxAmount: 900, totalAmount: 5900 });
});

test("no invoice-applicable tax rule produces zero tax", async () => {
    Tax.__setRules([rule({ applicableOn: "BILLING" })]);
    const result = await billingService.calculateCompleteBilling(billInput);
    expect(result).toMatchObject({ subtotal: 5000, taxAmount: 0, totalAmount: 5000 });
});

test("inactive tax rules are not applied", async () => {
    Tax.__setRules([rule({ isActive: false })]);
    const result = await billingService.calculateCompleteBilling(billInput);
    expect(result.taxAmount).toBe(0);
});

test("tax rules outside the bill date are not applied", async () => {
    Tax.__setRules([rule({ effectiveFrom: "2026-12-01" }), rule({ id: "expired", effectiveTo: "2026-11-15" })]);
    const result = await billingService.calculateCompleteBilling(billInput);
    expect(result.taxAmount).toBe(0);
});

test("tax rules from another society are not applied", async () => {
    Tax.__setRules([rule({ societyId: "society-b" })]);
    const result = await billingService.calculateCompleteBilling(billInput);
    expect(result.taxAmount).toBe(0);
});

test("configured tax is applied once even when the caller supplies a tax amount", async () => {
    Tax.__setRules([rule()]);
    const result = await billingService.calculateCompleteBilling({ ...billInput, taxAmount: 900 });
    expect(result).toMatchObject({ taxAmount: 900, totalAmount: 5900 });
});

test("preview and saved draft use the same configured tax calculation", async () => {
    Tax.__setRules([rule()]);
    const preview = await billingService.calculateCompleteBilling(billInput);
    const draft = await billingService.createBilling({
        ...billInput,
        billNumber: "BILL-TAX-TEST",
        billingPeriod: "2026-11",
        dueDate: "2026-11-23",
        ledgerAccountId: "ledger-a",
        taxAmount: preview.taxAmount,
        penaltyAmount: 0
    });

    expect(draft).toMatchObject({
        subtotal: preview.subtotal,
        previousBalance: preview.previousBalance,
        taxAmount: preview.taxAmount,
        penaltyAmount: preview.penaltyAmount,
        totalAmount: preview.totalAmount,
        status: "DRAFT"
    });
});

test("previous balance remains untaxed and display-only while current charges and penalty remain payable", async () => {
    Tax.__setRules([rule()]);
    InvoiceRepository.findOutstandingByUnit.mockResolvedValue([{ outstandingAmount: "2000.00" }]);
    const result = await billingService.calculateCompleteBilling({ ...billInput, penaltyAmount: 100 });
    expect(result).toMatchObject({
        subtotal: 5000,
        previousBalance: 2000,
        taxAmount: 900,
        penaltyAmount: 100,
        totalAmount: 6000
    });
});
