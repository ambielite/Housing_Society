jest.mock("../src/config/db", () => ({ pool: { end: jest.fn().mockResolvedValue(undefined) } }));
jest.mock("../src/config/database", () => ({ transaction: jest.fn(), close: jest.fn().mockResolvedValue(undefined) }));
jest.mock("../src/modules/financial/billing/billing.repository", () => ({ findById: jest.fn() }));
jest.mock("../src/modules/financial/invoice/invoice.repository", () => ({
    findByBillingId: jest.fn(),
    findById: jest.fn(),
    lockUnitFinancialScope: jest.fn(),
    createItem: jest.fn()
}));
jest.mock("../src/modules/financial/invoice/invoice.model", () => ({}));
jest.mock("../src/modules/financial/invoice/previousBalance.service", () => ({ hasSourceTable: jest.fn() }));
jest.mock("../src/modules/financial/billing-config/billingConfig.model", () => ({ findOne: jest.fn() }));
jest.mock("../src/modules/financial/ledger-account/ledgerAccount.model", () => ({ findOne: jest.fn() }));
jest.mock("../src/modules/financial/account/account.model", () => ({ findOne: jest.fn() }));
jest.mock("../src/modules/financial/accounting-period/accountingPeriod.model", () => ({ findOne: jest.fn() }));
jest.mock("../src/modules/financial/journal/journal.model", () => ({ findOne: jest.fn(), create: jest.fn() }));
jest.mock("../src/modules/financial/journal/journalLine.model", () => ({ create: jest.fn() }));
jest.mock("../src/modules/financial/invoice/invoice.service", () => ({}));
jest.mock("../src/modules/financial/tax/tax.service", () => ({ calculateInvoiceTax: jest.fn() }));

const { Op } = require("sequelize");
const sequelize = require("../src/config/database");
const billingRepository = require("../src/modules/financial/billing/billing.repository");
const invoiceRepository = require("../src/modules/financial/invoice/invoice.repository");
const BillingConfig = require("../src/modules/financial/billing-config/billingConfig.model");
const LedgerAccount = require("../src/modules/financial/ledger-account/ledgerAccount.model");
const Account = require("../src/modules/financial/account/account.model");
const AccountingPeriod = require("../src/modules/financial/accounting-period/accountingPeriod.model");
const Journal = require("../src/modules/financial/journal/journal.model");
const JournalLine = require("../src/modules/financial/journal/journalLine.model");
const billingService = require("../src/modules/financial/billing/billing.service");

const makeFixture = (overrides = {}) => {
    const transaction = {
        LOCK: { UPDATE: "UPDATE" },
        finished: undefined,
        commit: jest.fn(async function () { this.finished = "commit"; }),
        rollback: jest.fn(async function () { this.finished = "rollback"; })
    };
    const billing = {
        id: "billing-a",
        societyId: "society-a",
        unitId: "unit-a",
        ledgerAccountId: "ledger-a",
        billNumber: "BILL-A",
        billDate: "2026-11-23",
        dueDate: "2026-11-23",
        status: "ISSUED",
        subtotal: "5000.00",
        previousBalance: "0.00",
        taxAmount: "900.00",
        penaltyAmount: "0.00",
        totalAmount: "5900.00",
        paidAmount: "0.00",
        outstandingAmount: "5900.00",
        update: jest.fn(async function (data) { Object.assign(this, data); }),
        ...overrides.billing
    };
    const invoice = {
        id: "invoice-a",
        billingId: billing.id,
        societyId: billing.societyId,
        unitId: billing.unitId,
        status: billing.status,
        subtotal: billing.subtotal,
        previousBalance: billing.previousBalance,
        taxAmount: billing.taxAmount,
        penaltyAmount: billing.penaltyAmount,
        totalAmount: billing.totalAmount,
        paidAmount: billing.paidAmount,
        outstandingAmount: billing.outstandingAmount,
        update: jest.fn(async function (data) { Object.assign(this, data); }),
        ...overrides.invoice
    };
    const journal = { id: "journal-penalty", update: jest.fn().mockResolvedValue(undefined) };

    sequelize.transaction.mockResolvedValue(transaction);
    invoiceRepository.findByBillingId.mockResolvedValue(invoice);
    invoiceRepository.findById.mockResolvedValue(invoice);
    invoiceRepository.createItem.mockResolvedValue({ id: "item-penalty" });
    billingRepository.findById.mockResolvedValue(billing);
    BillingConfig.findOne.mockResolvedValue({
        id: "penalty-rule-a",
        code: "PEN-001",
        name: "Penalty",
        effectiveFrom: "2026-01-01",
        penaltyType: "FIXED_AMOUNT",
        penaltyValue: "100.00",
        gracePeriodDays: 5
    });
    Journal.findOne.mockResolvedValue(null);
    Journal.create.mockResolvedValue(journal);
    JournalLine.create.mockResolvedValue({});
    AccountingPeriod.findOne.mockResolvedValue({ id: "period-a" });
    LedgerAccount.findOne.mockResolvedValue({ id: "ledger-a", accountId: "receivable-a" });
    Account.findOne
        .mockResolvedValueOnce({ id: "receivable-a" })
        .mockResolvedValueOnce({ id: "income-a" });

    return { transaction, billing, invoice, journal };
};

beforeEach(() => jest.clearAllMocks());

const processOn = (asOfDate, societyId = "society-a") => billingService.applyPenaltyToBill({
    billingId: "billing-a",
    societyId,
    asOfDate
});

test("no penalty before the due date", async () => {
    const { billing, transaction } = makeFixture();
    const result = await processOn("2026-11-22");
    expect(result).toMatchObject({ applied: false, reason: "GRACE_PERIOD", penaltyEligibleDate: "2026-11-29" });
    expect(billing.update).not.toHaveBeenCalled();
    expect(transaction.commit).toHaveBeenCalledTimes(1);
});

test.each(["2026-11-24", "2026-11-28"])("no penalty during the five complete grace days (%s)", async (asOfDate) => {
    const { billing } = makeFixture();
    const result = await processOn(asOfDate);
    expect(result).toMatchObject({ applied: false, reason: "GRACE_PERIOD", penaltyEligibleDate: "2026-11-29" });
    expect(billing.update).not.toHaveBeenCalled();
});

test("applies the fixed penalty on the first eligible date and preserves GST", async () => {
    const { billing, invoice, transaction, journal } = makeFixture();
    const result = await processOn("2026-11-29");

    expect(result).toMatchObject({ applied: true, penaltyAmount: 100, penaltyEligibleDate: "2026-11-29" });
    expect(billing).toMatchObject({ penaltyAmount: 100, taxAmount: "900.00", totalAmount: 6000, outstandingAmount: 6000, status: "OVERDUE" });
    expect(invoice).toMatchObject({ penaltyAmount: 100, taxAmount: "900.00", totalAmount: 6000, outstandingAmount: 6000, status: "OVERDUE" });
    expect(invoiceRepository.createItem).toHaveBeenCalledWith(expect.objectContaining({ rate: 100, taxRate: 0, taxAmount: 0, totalAmount: 100 }), transaction);
    expect(JournalLine.create).toHaveBeenCalledTimes(2);
    expect(journal.update).toHaveBeenCalledWith(expect.objectContaining({ status: "POSTED" }), { transaction });
    expect(transaction.commit).toHaveBeenCalledTimes(1);
});

test("assesses the fixed penalty to a partially paid bill without changing its paid amount", async () => {
    const { billing, invoice } = makeFixture({
        billing: { status: "PARTIALLY_PAID", paidAmount: "1000.00", outstandingAmount: "4900.00" },
        invoice: { status: "PARTIALLY_PAID", paidAmount: "1000.00", outstandingAmount: "4900.00" }
    });
    const result = await processOn("2026-11-29");
    expect(result).toMatchObject({ applied: true, penaltyAmount: 100 });
    expect(billing).toMatchObject({ paidAmount: "1000.00", outstandingAmount: 5000, totalAmount: 6000 });
    expect(invoice).toMatchObject({ paidAmount: "1000.00", outstandingAmount: 5000, totalAmount: 6000 });
});

test("rolls back all penalty writes when the penalty invoice item fails", async () => {
    const { billing, invoice, transaction } = makeFixture();
    invoiceRepository.createItem.mockRejectedValueOnce(new Error("item insert failed"));
    await expect(processOn("2026-11-29")).rejects.toThrow("item insert failed");
    expect(transaction.rollback).toHaveBeenCalledTimes(1);
    expect(transaction.commit).not.toHaveBeenCalled();
    expect(billing.update).not.toHaveBeenCalled();
    expect(invoice.update).not.toHaveBeenCalled();
    expect(Journal.create).not.toHaveBeenCalled();
});

test("repeated processing does not apply or journal the penalty twice", async () => {
    const { billing, invoice } = makeFixture();
    await processOn("2026-11-29");
    const result = await processOn("2026-11-30");

    expect(result).toMatchObject({ applied: false, reason: "PENALTY_ALREADY_RECORDED" });
    expect(billing.penaltyAmount).toBe(100);
    expect(billing.totalAmount).toBe(6000);
    expect(billing.outstandingAmount).toBe(6000);
    expect(invoice.totalAmount).toBe(6000);
    expect(Journal.create).toHaveBeenCalledTimes(1);
});

test("does not change an already recorded penalty", async () => {
    const { billing, invoice, transaction } = makeFixture({
        billing: { penaltyAmount: "100.00", totalAmount: "6000.00", outstandingAmount: "6000.00", status: "OVERDUE" },
        invoice: { penaltyAmount: "100.00", totalAmount: "6000.00", outstandingAmount: "6000.00", status: "OVERDUE" }
    });
    const result = await processOn("2026-12-01");
    expect(result).toMatchObject({ applied: false, reason: "PENALTY_ALREADY_RECORDED" });
    expect(billing.update).not.toHaveBeenCalled();
    expect(invoice.update).not.toHaveBeenCalled();
    expect(Journal.create).not.toHaveBeenCalled();
    expect(transaction.commit).toHaveBeenCalledTimes(1);
});

test("does not invent calculation rules for unsupported penalty types", async () => {
    const { billing } = makeFixture();
    BillingConfig.findOne.mockResolvedValueOnce({
        id: "percentage-rule", code: "PCT", effectiveFrom: "2026-01-01",
        penaltyType: "PERCENTAGE", penaltyValue: 2, gracePeriodDays: 0
    });
    const result = await processOn("2026-11-29");
    expect(result).toMatchObject({ applied: false, reason: "NO_ACTIVE_FIXED_PENALTY_RULE" });
    expect(billing.update).not.toHaveBeenCalled();
    expect(Journal.create).not.toHaveBeenCalled();
});

test("fully paid, draft, cancelled, and otherwise ineligible bills are skipped", async () => {
    for (const status of ["PAID", "DRAFT", "CANCELLED"]) {
        const { billing, transaction } = makeFixture({ billing: { status }, invoice: { status } });
        const result = await processOn("2026-12-01");
        expect(result).toMatchObject({ applied: false, reason: "BILL_NOT_ELIGIBLE" });
        expect(billing.update).not.toHaveBeenCalled();
        expect(transaction.commit).toHaveBeenCalledTimes(1);
    }
    const { billing } = makeFixture({ billing: { outstandingAmount: "0.00" }, invoice: { outstandingAmount: "0.00" } });
    const result = await processOn("2026-12-01");
    expect(result).toMatchObject({ applied: false, reason: "NO_OUTSTANDING_BALANCE" });
    expect(billing.update).not.toHaveBeenCalled();
});

test("rejects a different society or a mismatched linked unit without updates", async () => {
    const { billing } = makeFixture();
    await expect(processOn("2026-11-29", "society-b")).rejects.toThrow("selected society");
    expect(billing.update).not.toHaveBeenCalled();

    makeFixture({ invoice: { unitId: "unit-b" } });
    await expect(processOn("2026-11-29")).rejects.toThrow("selected society or linked invoice");
});

test("preserves previous balance and reconciles total and outstanding after assessment", async () => {
    const { billing, invoice } = makeFixture({
        billing: { previousBalance: "250.00", totalAmount: "5900.00", outstandingAmount: "5900.00" },
        invoice: { previousBalance: "250.00", totalAmount: "5900.00", outstandingAmount: "5900.00" }
    });
    await processOn("2026-11-29");
    expect(billing).toMatchObject({ previousBalance: "250.00", taxAmount: "900.00", penaltyAmount: 100, totalAmount: 6000, outstandingAmount: 6000 });
    expect(invoice).toMatchObject({ previousBalance: "250.00", taxAmount: "900.00", penaltyAmount: 100, totalAmount: 6000, outstandingAmount: 6000 });
});

test("uses the requested society and processing date for the active penalty rule query", async () => {
    makeFixture();
    await processOn("2026-11-29");
    expect(BillingConfig.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
            societyId: "society-a",
            configType: "PENALTY_RULE",
            isActive: true,
            effectiveFrom: { [Op.lte]: "2026-11-23" },
            [Op.or]: expect.arrayContaining([
                { effectiveTo: null },
                { effectiveTo: { [Op.gte]: "2026-11-23" } }
            ])
        })
    }));
});
