const { Op } = require("sequelize");

const sequelize =
    require("../../../config/database");

const repository =
    require("./billing.repository");
const Unit = require("../../societies/unit/unit.model");

const assertUnitCanBeBilled = async (unitId, transaction = null) => {
    const unit = await Unit.findOne({
        where: { id: unitId },
        ...(transaction ? { transaction } : {})
    });
    if (!unit || unit.status === "VACANT") {
        throw new Error("Bills cannot be generated or assigned to vacant units.");
    }
};

const BillingConfig =
    require("../billing-config/billingConfig.model");

const LedgerAccount =
    require("../ledger-account/ledgerAccount.model");

const Account =
    require("../account/account.model");

const AccountingPeriod =
    require("../accounting-period/accountingPeriod.model");

const Journal =
    require("../journal/journal.model");

const JournalLine =
    require("../journal/journalLine.model");

const InvoiceService =
    require("../invoice/invoice.service");

const InvoiceRepository =
    require("../invoice/invoice.repository");
const Invoice = require("../invoice/invoice.model");
const PreviousBalanceService = require("../invoice/previousBalance.service");

const TaxService =
    require("../tax/tax.service");

const { getSocietyBusinessDate } = require("./businessDate");

const toCents = (amount) => Math.round(Number(amount || 0) * 100);
const fromCents = (amount) => Number((amount / 100).toFixed(2));
const calculatePayableTotal = ({
    previousBalance = 0,
    subtotal = 0,
    taxAmount = 0,
    penaltyAmount = 0
}) => {
    const amounts = [previousBalance, subtotal, taxAmount, penaltyAmount]
        .map((amount) => Number(amount));
    if (amounts.some((amount) => !Number.isFinite(amount) || amount < 0)) {
        throw new Error("Billing amounts must be non-negative monetary values");
    }
    // Previous Balance is statement-only and is not part of this invoice's payable total.
    return fromCents(toCents(Number(subtotal || 0)) + toCents(Number(taxAmount || 0)) + toCents(Number(penaltyAmount || 0)));
};

const isDateOnly = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const getPenaltyEligibleDate = (dueDate, gracePeriodDays) => {
    if (!isDateOnly(dueDate)) throw new Error("Bill due date is invalid");
    const graceDays = Number(gracePeriodDays || 0);
    if (!Number.isInteger(graceDays) || graceDays < 0) {
        throw new Error("Penalty grace period must be a non-negative whole number of days");
    }
    const eligibleDate = new Date(`${dueDate}T00:00:00.000Z`);
    eligibleDate.setUTCDate(eligibleDate.getUTCDate() + graceDays + 1);
    return eligibleDate.toISOString().slice(0, 10);
};

const normalizeDateOnly = (value) => value instanceof Date
    ? value.toISOString().slice(0, 10)
    : String(value || "").slice(0, 10);

const getPenaltyRuleSnapshot = async (societyId, effectiveDate, transaction = null) => {
    const rule = await BillingConfig.findOne({
        where: {
            societyId,
            configType: "PENALTY_RULE",
            isActive: true,
            effectiveFrom: { [Op.lte]: effectiveDate },
            [Op.or]: [
                { effectiveTo: null },
                { effectiveTo: { [Op.gte]: effectiveDate } }
            ]
        },
        order: [["effective_from", "DESC"]],
        ...(transaction ? { transaction } : {})
    });

    if (!rule) {
        return { version: 1, applicable: false, evaluatedDate: effectiveDate };
    }

    return {
        version: 1,
        applicable: true,
        evaluatedDate: effectiveDate,
        ruleId: rule.id,
        code: rule.code,
        name: rule.name,
        penaltyType: rule.penaltyType,
        penaltyValue: Number(rule.penaltyValue || 0),
        gracePeriodDays: Number(rule.gracePeriodDays || 0),
        effectiveFrom: normalizeDateOnly(rule.effectiveFrom),
        effectiveTo: rule.effectiveTo ? normalizeDateOnly(rule.effectiveTo) : null,
        isTaxable: Boolean(rule.isTaxable),
        taxRate: Number(rule.taxRate || 0)
    };
};

const getPenaltyProcessingState = (billing, rule, processingDate) => {
    if (toCents(billing.penaltyAmount) > 0) {
        return { status: "APPLIED", eligibleDate: null, ruleCode: rule?.code || null };
    }
    if (
        !["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(billing.status) ||
        toCents(billing.outstandingAmount) <= 0
    ) {
        return { status: "INELIGIBLE", reason: "BILL_NOT_ELIGIBLE", eligibleDate: null, ruleCode: rule?.code || null };
    }
    if (!rule?.applicable || rule.penaltyType !== "FIXED_AMOUNT") {
        return {
            status: "INELIGIBLE",
            reason: rule?.applicable ? "UNSUPPORTED_PENALTY_TYPE" : "NO_APPLICABLE_PENALTY_RULE",
            penaltyType: rule?.penaltyType || null,
            eligibleDate: null,
            ruleCode: rule?.code || null
        };
    }

    const eligibleDate = getPenaltyEligibleDate(billing.dueDate, rule.gracePeriodDays);
    if (processingDate < eligibleDate) {
        return { status: "INELIGIBLE", reason: "GRACE_PERIOD", eligibleDate, ruleCode: rule.code };
    }
    return { status: "PENDING", reason: "AWAITING_SCHEDULED_PROCESSING", eligibleDate, ruleCode: rule.code };
};

// =====================================================
// BILLING CONFIGURATION
// =====================================================

const getBillingRule = async (
    societyId,
    billingRuleCode,
    billDate
) => {

    const config =
        await BillingConfig.findOne({
            where: {
                societyId,

                configType: "BILLING_RULE",

                code: billingRuleCode,

                isActive: true,

                effectiveFrom: {
                    [Op.lte]: billDate
                },

                [Op.or]: [
                    {
                        effectiveTo: null
                    },
                    {
                        effectiveTo: {
                            [Op.gte]: billDate
                        }
                    }
                ]
            },

            order: [
                ["effective_from", "DESC"]
            ]
        });


    if (!config) {
        throw new Error(
            "No active billing rule found for the selected date"
        );
    }


    return config;
};


// =====================================================
// FLAT RATE
// =====================================================

const calculateFlatRate = (
    config
) => {

    const amount =
        Number(config.flatAmount || 0);


    if (amount <= 0) {
        throw new Error(
            "Invalid flat rate configuration"
        );
    }


    return amount;
};


// =====================================================
// AREA BASED
// =====================================================

const calculateAreaBased = (
    config,
    unitArea
) => {

    const area =
        Number(unitArea || 0);

    const rate =
        Number(config.ratePerArea || 0);


    if (area <= 0) {
        throw new Error(
            "Unit area must be greater than 0 for area-based billing"
        );
    }


    if (rate <= 0) {
        throw new Error(
            "ratePerArea must be greater than 0"
        );
    }


    return area * rate;
};


// =====================================================
// HYBRID
// =====================================================

const calculateHybrid = (
    config,
    unitArea
) => {

    const area =
        Number(unitArea || 0);

    const fixedAmount =
        Number(config.fixedAmount || 0);

    const rate =
        Number(config.ratePerArea || 0);


    if (area <= 0) {
        throw new Error(
            "Unit area must be greater than 0 for hybrid billing"
        );
    }


    if (rate <= 0) {
        throw new Error(
            "ratePerArea must be greater than 0"
        );
    }


    if (fixedAmount < 0) {
        throw new Error(
            "fixedAmount cannot be negative"
        );
    }


    return (
        fixedAmount +
        (area * rate)
    );
};


// =====================================================
// BILLING CALCULATION
// =====================================================

const calculateBillingAmount = (
    config,
    unitArea
) => {

    switch (
        config.billingModel
    ) {

        case "FLAT_RATE":

            return calculateFlatRate(
                config
            );


        case "AREA_BASED":

            return calculateAreaBased(
                config,
                unitArea
            );


        case "HYBRID":

            return calculateHybrid(
                config,
                unitArea
            );


        default:

            throw new Error(
                `Unsupported billing model: ${config.billingModel}`
            );
    }
};


// =====================================================
// PREVIOUS BALANCE
// =====================================================

const calculatePreviousBalance = async (
    societyId,
    unitId,
    billDate,
    billingPeriod = null,
    transaction = null
) => {

    const previousInvoices =
        await InvoiceRepository.findOutstandingByUnit(
            societyId,
            unitId,
            billDate,
            transaction,
            billingPeriod
        );


    let previousBalance = 0;


    for (
        const invoice of previousInvoices
    ) {

        previousBalance += toCents(invoice.outstandingAmount);
    }


    return Number(
        fromCents(previousBalance)
    );
};


// =====================================================
// COMPLETE BILLING CALCULATION
// =====================================================

const calculateCompleteBilling = async ({
    societyId,
    unitId,
    billingRuleCode,
    billDate,
    unitArea,
    penaltyAmount = 0,
    billingPeriod = null,
    includePreviousBalance = null,
    transaction = null
}) => {

    await assertUnitCanBeBilled(unitId, transaction);

    const billingRule =
        await getBillingRule(
            societyId,
            billingRuleCode,
            billDate
        );


    const chargeAmount =
        calculateBillingAmount(
            billingRule,
            unitArea
        );


    const showPreviousBalance = includePreviousBalance === null
        ? billingRule.chargeCategory === "MAINTENANCE"
        : Boolean(includePreviousBalance);
    const previousBalance = showPreviousBalance
        ? await calculatePreviousBalance(
            societyId,
            unitId,
            billDate,
            billingPeriod,
            transaction
        )
        : 0;


    const penalty =
        fromCents(toCents(penaltyAmount));


    if (penalty < 0) {
        throw new Error(
            "penaltyAmount cannot be negative"
        );
    }


    const subtotal =
        fromCents(toCents(chargeAmount));

    // Maintenance bills become customer invoices when issued, so use the
    // existing invoice-scoped tax rules for the bill's charge only. This
    // keeps carried balances and penalties untaxed, matching invoice items.
    const invoiceTax = await TaxService.calculateInvoiceTax(
        societyId,
        subtotal,
        billDate
    );
    const tax = fromCents(toCents(invoiceTax.totalTax));

    if (tax < 0) {
        throw new Error("taxAmount cannot be negative");
    }


    const totalAmount = calculatePayableTotal({
        subtotal,
        previousBalance,
        taxAmount: tax,
        penaltyAmount: penalty
    });


    return {

        billingRuleId:
            billingRule.id,

        billingModel:
            billingRule.billingModel,

        billingRuleCode:
            billingRule.code,

        subtotal,

        previousBalance,

        taxAmount: tax,

        penaltyAmount: penalty,

        totalAmount
    };
};


// =====================================================
// CREATE BILLING
// =====================================================

const createBillingRecord = async (
    data,
    transaction = null
) => {

    await assertUnitCanBeBilled(data.unitId, transaction);

    const existing =
        await repository.findByBillNumber(
            data.societyId,
            data.billNumber
        );


    if (existing) {
        throw new Error(
            "Bill number already exists"
        );
    }


    const billDate =
        new Date(data.billDate);

    const dueDate =
        new Date(data.dueDate);


    if (billDate > dueDate) {
        throw new Error(
            "billDate cannot be greater than dueDate"
        );
    }


    const ledgerAccount =
        await LedgerAccount.findOne({
            where: {
                id: data.ledgerAccountId,

                societyId:
                    data.societyId,

                isActive: true
            }
        });


    if (!ledgerAccount) {
        throw new Error(
            "Active ledger account not found"
        );
    }


    if (
        ledgerAccount.unitId &&
        ledgerAccount.unitId !== data.unitId
    ) {
        throw new Error(
            "Ledger account does not belong to the selected unit"
        );
    }

    const account =
        await Account.findOne({
            where: {
                id:
                    ledgerAccount.accountId,

                societyId:
                    data.societyId,

                isActive: true
            }
        });


    if (!account) {
        throw new Error(
            "Mapped accounting account not found"
        );
    }


    if (
        account.accountType !==
        "RECEIVABLE"
    ) {
        throw new Error(
            "Ledger must be mapped to a RECEIVABLE account"
        );
    }


    let calculatedData = {

        previousBalance:
            Number(
                data.previousBalance || 0
            ),

        subtotal:
            Number(
                data.subtotal || 0
            ),

        taxAmount:
            Number(
                data.taxAmount || 0
            ),

        penaltyAmount:
            Number(
                data.penaltyAmount || 0
            )
    };


    // If a billing rule is provided,
    // calculate the amount automatically.
    if (data.billingRuleCode) {

        calculatedData =
            await calculateCompleteBilling({

                societyId:
                    data.societyId,

                unitId:
                    data.unitId,

                billingRuleCode:
                    data.billingRuleCode,

                billDate:
                    data.billDate,

                unitArea:
                    data.unitArea,

                taxAmount:
                    data.taxAmount || 0,

                penaltyAmount:
                    data.penaltyAmount || 0
            });
    }

    calculatedData.subtotal = fromCents(toCents(calculatedData.subtotal));
    calculatedData.previousBalance = fromCents(toCents(calculatedData.previousBalance));
    calculatedData.taxAmount = fromCents(toCents(calculatedData.taxAmount));
    calculatedData.penaltyAmount = fromCents(toCents(calculatedData.penaltyAmount));
    if ([
        calculatedData.subtotal,
        calculatedData.previousBalance,
        calculatedData.taxAmount,
        calculatedData.penaltyAmount,
    ].some((amount) => !Number.isFinite(amount))) {
        throw new Error("Billing amounts must be valid monetary values");
    }

    if (
        calculatedData.subtotal < 0 ||
        calculatedData.previousBalance < 0 ||
        calculatedData.taxAmount < 0 ||
        calculatedData.penaltyAmount < 0
    ) {
        throw new Error(
            "Billing amounts cannot be negative"
        );
    }


    const totalAmount = calculatePayableTotal(calculatedData);
    const penaltyRuleSnapshot = await getPenaltyRuleSnapshot(data.societyId, data.billDate);


    const billing =
        await repository.create({

            societyId:
                data.societyId,

            unitId:
                data.unitId,

            memberId:
                data.memberId || null,

            ledgerAccountId:
                data.ledgerAccountId,

            billingConfigId:
                calculatedData.billingRuleId ||
                data.billingConfigId ||
                null,

            penaltyRuleSnapshot,

            billNumber:
                data.billNumber,

            billingPeriod:
                data.billingPeriod,

            billDate:
                data.billDate,

            dueDate:
                data.dueDate,

            description:
                data.description || null,

            billingModel:
                calculatedData.billingModel ||
                data.billingModel ||
                null,

            unitArea:
                data.unitArea || null,

            ratePerArea:
                data.ratePerArea || null,

            fixedAmount:
                data.fixedAmount || null,

            previousBalance:
                calculatedData.previousBalance,

            subtotal:
                calculatedData.subtotal,

            taxAmount:
                calculatedData.taxAmount,

            penaltyAmount:
                calculatedData.penaltyAmount,

            totalAmount,

            paidAmount: 0,

            outstandingAmount:
                totalAmount,

            status: "DRAFT",

            remarks:
                data.remarks || null
        }, transaction);


    return billing;
};

const createBilling = async (data) => {
    const billingRule = data.billingConfigId
        ? await BillingConfig.findByPk(data.billingConfigId)
        : data.billingRuleCode
            ? await getBillingRule(data.societyId, data.billingRuleCode, data.billDate)
            : null;
    const isMonthlyFlatMaintenance = billingRule?.societyId === data.societyId
        && billingRule?.configType === "BILLING_RULE"
        && billingRule?.code === "BR-MNT-001";
    if (!isMonthlyFlatMaintenance) return createBillingRecord(data);

    const transaction = await sequelize.transaction();
    try {
        await repository.lockMonthlyMaintenanceScope({
            societyId: data.societyId,
            memberId: data.memberId,
            unitId: data.unitId,
            billingPeriod: data.billingPeriod,
            billingConfigId: billingRule.id,
            transaction,
        });
        const duplicate = await repository.findIssuedMonthlyMaintenanceDuplicate({
            societyId: data.societyId,
            memberId: data.memberId,
            unitId: data.unitId,
            billingPeriod: data.billingPeriod,
            billingConfigId: billingRule.id,
            transaction,
        });
        if (duplicate) {
            throw new Error("Monthly Flat Rent bill already exists for this resident for the selected month.");
        }
        const created = await createBillingRecord(data, transaction);
        await transaction.commit();
        return created;
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
};


// =====================================================
// ISSUE BILLING
// =====================================================

const issueBilling = async (
    id,
    options = {}
) => {

    const transaction = options.transaction || await sequelize.transaction();
    const ownsTransaction = !options.transaction;


    try {

        const billing =
            await repository.findById(
                id,
                transaction,
                true
            );


        if (!billing) {
            throw new Error(
                "Billing record not found"
            );
        }

        await assertUnitCanBeBilled(billing.unitId, transaction);


        if (
            billing.status !==
            "DRAFT"
        ) {
            throw new Error(
                "Only DRAFT billing can be issued"
            );
        }

        await InvoiceRepository.lockUnitFinancialScope(
            billing.societyId,
            billing.unitId,
            transaction
        );

        const billingRule = billing.billingConfigId
            ? await BillingConfig.findByPk(billing.billingConfigId, { transaction })
            : null;
        const isMonthlyFlatMaintenance = billingRule?.societyId === billing.societyId
            && billingRule?.configType === "BILLING_RULE"
            && billingRule?.code === "BR-MNT-001";
        if (isMonthlyFlatMaintenance) {
            await repository.lockMonthlyMaintenanceScope({
                societyId: billing.societyId,
                memberId: billing.memberId,
                unitId: billing.unitId,
                billingPeriod: billing.billingPeriod,
                billingConfigId: billing.billingConfigId,
                transaction,
            });
            const existingIssuedBill = await repository.findIssuedMonthlyMaintenanceDuplicate({
                societyId: billing.societyId,
                unitId: billing.unitId,
                memberId: billing.memberId,
                billingPeriod: billing.billingPeriod,
                billingConfigId: billing.billingConfigId,
                excludeBillingId: billing.id,
                transaction,
            });
            if (existingIssuedBill) {
                throw new Error(
                    "Monthly Flat Maintenance bill has already been issued for this unit for the selected billing period."
                );
            }
        }
        const includePreviousBalance = options.includePreviousBalance !== undefined
            ? Boolean(options.includePreviousBalance)
            : billingRule?.chargeCategory === "MAINTENANCE";
        const previousBalanceSources = includePreviousBalance
            ? await InvoiceRepository.findOutstandingByUnit(
                billing.societyId,
                billing.unitId,
                billing.billDate,
                transaction,
                billing.billingPeriod
            )
            : [];
        const invoicePreviousBalance = fromCents(previousBalanceSources
            .reduce((sum, source) => sum + toCents(source.outstandingAmount), 0));


        const accountingPeriod =
            await AccountingPeriod.findOne({

                where: {

                    societyId:
                        billing.societyId,

                    status: "OPEN",

                    startDate: {
                        [Op.lte]:
                            billing.billDate
                    },

                    endDate: {
                        [Op.gte]:
                            billing.billDate
                    }
                },

                transaction
            });


        if (!accountingPeriod) {
            throw new Error(
                "No OPEN accounting period found for bill date"
            );
        }


        const ledgerAccount =
            await LedgerAccount.findOne({

                where: {

                    id:
                        billing.ledgerAccountId,

                    societyId:
                        billing.societyId,

                    isActive: true
                },

                transaction
            });


        if (!ledgerAccount) {
            throw new Error(
                "Active ledger account not found"
            );
        }


        const receivableAccount =
            await Account.findOne({

                where: {

                    id:
                        ledgerAccount.accountId,

                    societyId:
                        billing.societyId,

                    accountType:
                        "RECEIVABLE",

                    isActive: true
                },

                transaction
            });


        if (!receivableAccount) {
            throw new Error(
                "Active RECEIVABLE account not found"
            );
        }


        const incomeAccount =
            await Account.findOne({

                where: {

                    societyId:
                        billing.societyId,

                    accountCode:
                        "4100",

                    accountType:
                        "INCOME",

                    isActive: true
                },

                transaction
            });


        if (!incomeAccount) {
            throw new Error(
                "Maintenance Income account 4100 not found"
            );
        }


        const totalAmount =
            Number(
                billing.totalAmount
            );

        const chargeAmountCents =
            toCents(billing.subtotal) +
            toCents(billing.taxAmount) +
            toCents(billing.penaltyAmount);
        const expectedTotalCents = chargeAmountCents;

        if (
            expectedTotalCents !== toCents(totalAmount)
        ) {
            throw new Error(
                `Maintenance Bill ${billing.billNumber} totals do not reconcile to its stored components.`
            );
        }

        const existingBillingJournal = await Journal.findOne({
            where: {
                societyId: billing.societyId,
                referenceType: "BILLING",
                referenceId: billing.id,
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (existingBillingJournal || billing.journalId) {
            throw new Error(
                `A Journal already exists for Maintenance Bill ${billing.billNumber}; reconcile this record before issuing.`
            );
        }

        const taxRate = Number(billing.subtotal) > 0
            ? Number((Number(billing.taxAmount || 0) / Number(billing.subtotal) * 100).toFixed(2))
            : 0;

        const invoiceNumber =
            `INV-${billing.billNumber}`;

        const existingInvoice = await InvoiceRepository.findByBillingId(
            billing.id,
            transaction
        );
        const invoiceResult = existingInvoice
            ? { invoice: existingInvoice, duplicate: true }
            : await InvoiceService.createInvoice({
                societyId: billing.societyId,
                unitId: billing.unitId,
                memberId: billing.memberId || null,
                billingId: billing.id,
                invoiceNumber,
                billingPeriod: billing.billingPeriod,
                invoiceDate: billing.billDate,
                dueDate: billing.dueDate,
                previousBalance: invoicePreviousBalance,
                penaltyAmount: Number(billing.penaltyAmount || 0),
                description: billing.description || `Maintenance Bill ${billing.billNumber}`,
                remarks: `Generated when Maintenance Bill ${billing.billNumber} was issued`,
                idempotencyKey: `manual-billing:${billing.id}`,
                accountingTotals: {
                    subtotal: Number(billing.subtotal || 0),
                    taxAmount: Number(billing.taxAmount || 0),
                    previousBalance: invoicePreviousBalance,
                    penaltyAmount: Number(billing.penaltyAmount || 0),
                },
                previousBalanceSources,
                items: [{
                    description: `Maintenance Bill ${billing.billNumber}`,
                    quantity: 1,
                    rate: Number(billing.subtotal || 0),
                    taxRate,
                    taxAmount: Number(billing.taxAmount || 0),
                },
                ...(Number(billing.penaltyAmount || 0) > 0 ? [{
                    description: `Penalty for ${billing.billNumber}`,
                    quantity: 1,
                    rate: Number(billing.penaltyAmount),
                    taxRate: 0,
                    taxAmount: 0,
                }] : [])],
            }, { transaction });

        const invoice = invoiceResult.invoice;
        const expectedOutstanding = Math.max(
            totalAmount - Number(invoice.paidAmount || 0),
            0
        );
        const itemSubtotal = Array.isArray(invoice.items)
            ? Number(invoice.items.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2))
            : NaN;
        const itemTax = Array.isArray(invoice.items)
            ? Number(invoice.items.reduce((sum, item) => sum + Number(item.taxAmount || 0), 0).toFixed(2))
            : NaN;
        const itemTotal = Array.isArray(invoice.items)
            ? Number(invoice.items.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0).toFixed(2))
            : NaN;

        if (
            invoice.societyId !== billing.societyId ||
            invoice.unitId !== billing.unitId ||
            invoice.memberId !== (billing.memberId || null) ||
            invoice.billingId !== billing.id ||
            invoice.billingPeriod !== billing.billingPeriod ||
            String(invoice.invoiceDate) !== String(billing.billDate) ||
            String(invoice.dueDate) !== String(billing.dueDate) ||
            Number(invoice.previousBalance) !== invoicePreviousBalance ||
            Number(invoice.subtotal) !== Number(billing.subtotal || 0) ||
            Number(invoice.taxAmount) !== Number(billing.taxAmount || 0) ||
            itemSubtotal !== Number((
                Number(billing.subtotal || 0) +
                Number(billing.penaltyAmount || 0)
            ).toFixed(2)) ||
            itemTax !== Number(billing.taxAmount || 0) ||
            itemTotal !== totalAmount ||
            Number(invoice.penaltyAmount) !== Number(billing.penaltyAmount || 0) ||
            Number(invoice.totalAmount) !== totalAmount ||
            Number(invoice.outstandingAmount) !== expectedOutstanding ||
            !Array.isArray(invoice.items) ||
            invoice.items.length === 0 ||
            invoice.journalId !== null ||
            invoice.status === "CANCELLED"
        ) {
            throw new Error(
                `An existing Invoice conflicts with Maintenance Bill ${billing.billNumber}`
            );
        }

        if (invoice.status === "DRAFT") {
            await InvoiceService.issueInvoice(invoice.id, transaction);
        } else if (!["ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE"].includes(invoice.status)) {
            throw new Error(
                `Invoice ${invoice.invoiceNumber} cannot be issued from status ${invoice.status}`
            );
        }

        const journalNumber =
            `JV-BILL-${Date.now()}`;


        const journal =
            await Journal.create({

                societyId:
                    billing.societyId,

                accountingPeriodId:
                    accountingPeriod.id,

                journalNumber,

                transactionDate:
                    billing.billDate,

                referenceType:
                    "BILLING",

                referenceId:
                    billing.id,

                description:
                    `Maintenance Bill ${billing.billNumber}`,

                status:
                    "DRAFT",

                totalDebit:
                    expectedTotalCents / 100,

                totalCredit:
                    expectedTotalCents / 100,

                postedBy:
                    null

            }, {
                transaction
            });


        await JournalLine.create({

            journalId:
                journal.id,

            accountId:
                receivableAccount.id,

            lineNumber: 1,

            description:
                `Receivable for ${billing.billNumber}`,

            debitAmount:
                expectedTotalCents / 100,

            creditAmount:
                0

        }, {
            transaction
        });


        await JournalLine.create({

            journalId:
                journal.id,

            accountId:
                incomeAccount.id,

            lineNumber: 2,

            description:
                `Income for ${billing.billNumber}`,

            debitAmount:
                0,

            creditAmount:
                expectedTotalCents / 100

        }, {
            transaction
        });


        // Controlled posting
        await journal.update({

            status:
                "POSTED",

            postedAt:
                new Date(),

            postedBy:
                null

        }, {
            transaction
        });


        await invoice.update({
            journalId: journal.id
        }, {
            transaction
        });


        await billing.update({

            previousBalance: invoicePreviousBalance,

            status:
                "ISSUED",

            journalId:
                journal.id,

            paidAmount:
                Number(invoice.paidAmount || 0),

            outstandingAmount:
                Number(invoice.outstandingAmount)

        }, {
            transaction
        });


        if (ownsTransaction) {
            await transaction.commit();
        }


        return billing;

    } catch (error) {

        if (
            ownsTransaction &&
            transaction &&
            !transaction.finished
        ) {
            await transaction.rollback();
        }

        throw error;
    }
};


// =====================================================
// GET ALL BILLINGS
// =====================================================

const getAll = async ({
    societyId,
    status,
    unitId
}) => {

    const where = {};

    if (societyId) {
        where.societyId =
            societyId;
    }

    if (status) {
        where.status =
            status;
    }

    if (unitId) {
        where.unitId =
            unitId;
    }


    const bills = await repository.findAll(where);
    const businessDate = getSocietyBusinessDate();
    const invoices = bills.length
        ? await Invoice.findAll({ where: { billingId: { [Op.in]: bills.map((bill) => bill.id) } } })
        : [];
    const invoiceByBillingId = new Map(invoices.map((invoice) => [invoice.billingId, invoice]));
    const liveBalances = await PreviousBalanceService.getLivePreviousBalances(invoices);
    const penaltyJournals = bills.length
        ? await Journal.findAll({
            where: {
                societyId: { [Op.in]: [...new Set(bills.map((bill) => bill.societyId))] },
                referenceType: "BILLING_PENALTY",
                referenceId: { [Op.in]: bills.map((bill) => bill.id) },
                status: "POSTED",
            },
            attributes: ["referenceId", "postedAt", "transactionDate"],
        })
        : [];
    const penaltyJournalByBillingId = new Map(penaltyJournals.map((journal) => [journal.referenceId, journal]));
    return Promise.all(bills.map(async (billing) => {
        const snapshot = billing.penaltyRuleSnapshot ||
            await getPenaltyRuleSnapshot(billing.societyId, billing.billDate);
        const invoice = invoiceByBillingId.get(billing.id);
        const liveBalance = invoice ? liveBalances.get(invoice.id) : null;
        const penaltyJournal = penaltyJournalByBillingId.get(billing.id);
        return {
            ...billing.toJSON(),
            previousBalance: liveBalance ? liveBalance.amount : Number(billing.previousBalance || 0),
            previousBalanceSources: liveBalance?.sources || [],
            penaltyAppliedAt: penaltyJournal?.postedAt || penaltyJournal?.transactionDate || null,
            penaltyProcessingState: getPenaltyProcessingState(billing, snapshot, businessDate)
        };
    }));
};


// =====================================================
// GET BILLING
// =====================================================

const getById = async (
    id
) => {

    const billing =
        await repository.findById(
            id
        );


    if (!billing) {
        throw new Error(
            "Billing record not found"
        );
    }


    return billing;
};


// =====================================================
// GET UNIT BILLING
// =====================================================

const getByUnit = async (
    societyId,
    unitId
) => {

    return repository.findByUnit(
        societyId,
        unitId
    );
};


// =====================================================
// APPLY ONE-TIME PENALTY TO ONE ISSUED BILL
// =====================================================

const applyPenaltyToBill = async ({ billingId, societyId, asOfDate }) => {
    if (!billingId || !societyId) {
        throw new Error("billingId and societyId are required");
    }
    const processingDate = asOfDate || getSocietyBusinessDate();
    if (!isDateOnly(processingDate)) {
        throw new Error("asOfDate must be a valid YYYY-MM-DD date");
    }

    const transaction = await sequelize.transaction();
    try {
        // Lock in the same order used by payment processing: Invoice, then Billing.
        const invoiceCandidate = await InvoiceRepository.findByBillingId(billingId, transaction);
        if (!invoiceCandidate) throw new Error("Issued bill invoice not found");
        await InvoiceRepository.lockUnitFinancialScope(
            invoiceCandidate.societyId,
            invoiceCandidate.unitId,
            transaction
        );
        const invoice = await InvoiceRepository.findById(invoiceCandidate.id, transaction, true);
        const billing = await repository.findById(billingId, transaction, true);
        if (!invoice || !billing) throw new Error("Bill or linked invoice not found");
        if (billing.societyId !== societyId || invoice.societyId !== societyId || invoice.billingId !== billing.id || invoice.unitId !== billing.unitId) {
            throw new Error("Bill does not belong to the selected society or linked invoice");
        }

        const eligibleStatuses = ["ISSUED", "PARTIALLY_PAID", "OVERDUE"];
        if (!eligibleStatuses.includes(billing.status) || !eligibleStatuses.includes(invoice.status)) {
            await transaction.commit();
            return { applied: false, reason: "BILL_NOT_ELIGIBLE", billing };
        }
        if (toCents(billing.outstandingAmount) <= 0 || toCents(invoice.outstandingAmount) <= 0) {
            await transaction.commit();
            return { applied: false, reason: "NO_OUTSTANDING_BALANCE", billing };
        }
        if (toCents(billing.penaltyAmount) !== 0 || toCents(invoice.penaltyAmount) !== toCents(billing.penaltyAmount)) {
            await transaction.commit();
            return { applied: false, reason: "PENALTY_ALREADY_RECORDED", billing };
        }
        if (
            toCents(billing.totalAmount) !== toCents(billing.paidAmount) + toCents(billing.outstandingAmount) ||
            toCents(invoice.totalAmount) !== toCents(invoice.paidAmount) + toCents(invoice.outstandingAmount) ||
            toCents(invoice.totalAmount) !== toCents(billing.totalAmount) ||
            toCents(invoice.taxAmount) !== toCents(billing.taxAmount)
        ) {
            throw new Error("Bill and invoice totals do not reconcile before penalty processing");
        }

        // Bills created after snapshots were introduced carry an immutable rule
        // snapshot. Legacy bills resolve the rule effective on their bill date.
        // Once a penalty exists, the early idempotency return above protects it.
        const ruleSnapshot = billing.penaltyRuleSnapshot ||
            await getPenaltyRuleSnapshot(societyId, billing.billDate, transaction);
        if (!ruleSnapshot?.applicable || ruleSnapshot.penaltyType !== "FIXED_AMOUNT") {
            await transaction.commit();
            return { applied: false, reason: "NO_ACTIVE_FIXED_PENALTY_RULE", billing };
        }

        const penaltyEligibleDate = getPenaltyEligibleDate(billing.dueDate, ruleSnapshot.gracePeriodDays);
        if (processingDate < penaltyEligibleDate) {
            await transaction.commit();
            return { applied: false, reason: "GRACE_PERIOD", penaltyEligibleDate, billing };
        }

        const penalty = fromCents(toCents(ruleSnapshot.penaltyValue));
        if (!Number.isFinite(penalty) || penalty <= 0) {
            await transaction.commit();
            return { applied: false, reason: "INVALID_PENALTY_AMOUNT", penaltyEligibleDate, billing };
        }

        const existingPenaltyJournal = await Journal.findOne({
            where: { societyId, referenceType: "BILLING_PENALTY", referenceId: billing.id },
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        if (existingPenaltyJournal) {
            throw new Error("Penalty journal exists while bill penalty is unset; reconcile this bill before retrying");
        }

        const accountingPeriod = await AccountingPeriod.findOne({
            where: {
                societyId,
                status: "OPEN",
                startDate: { [Op.lte]: processingDate },
                endDate: { [Op.gte]: processingDate }
            },
            transaction
        });
        if (!accountingPeriod) throw new Error("No OPEN accounting period found for penalty date");

        const ledgerAccount = await LedgerAccount.findOne({
            where: { id: billing.ledgerAccountId, societyId, isActive: true },
            transaction
        });
        if (!ledgerAccount) throw new Error("Active ledger account not found");
        const receivableAccount = await Account.findOne({
            where: { id: ledgerAccount.accountId, societyId, accountType: "RECEIVABLE", isActive: true },
            transaction
        });
        if (!receivableAccount) throw new Error("Active RECEIVABLE account not found");
        const incomeAccount = await Account.findOne({
            where: { societyId, accountCode: "4100", accountType: "INCOME", isActive: true },
            transaction
        });
        if (!incomeAccount) throw new Error("Maintenance Income account 4100 not found");

        const nextPenalty = fromCents(toCents(billing.penaltyAmount) + toCents(penalty));
        const nextTotal = fromCents(toCents(billing.totalAmount) + toCents(penalty));
        const nextOutstanding = fromCents(toCents(billing.outstandingAmount) + toCents(penalty));
        const nextInvoicePenalty = fromCents(toCents(invoice.penaltyAmount) + toCents(penalty));
        const nextInvoiceTotal = fromCents(toCents(invoice.totalAmount) + toCents(penalty));
        const nextInvoiceOutstanding = fromCents(toCents(invoice.outstandingAmount) + toCents(penalty));
        const penaltyDescription = `Late payment penalty (${ruleSnapshot.code || ruleSnapshot.ruleId || "fixed rule"})`;

        await InvoiceRepository.createItem({
            invoiceId: invoice.id,
            description: penaltyDescription,
            quantity: 1,
            rate: penalty,
            amount: penalty,
            taxRate: 0,
            taxAmount: 0,
            totalAmount: penalty
        }, transaction);

        const journal = await Journal.create({
            societyId,
            accountingPeriodId: accountingPeriod.id,
            journalNumber: `JV-BILL-PEN-${Date.now()}-${billing.id.slice(0, 8)}`,
            transactionDate: processingDate,
            referenceType: "BILLING_PENALTY",
            referenceId: billing.id,
            description: `${penaltyDescription} for ${billing.billNumber}`,
            status: "DRAFT",
            totalDebit: penalty,
            totalCredit: penalty,
            postedBy: null
        }, { transaction });
        await JournalLine.create({
            journalId: journal.id,
            accountId: receivableAccount.id,
            lineNumber: 1,
            description: `Receivable penalty for ${billing.billNumber}`,
            debitAmount: penalty,
            creditAmount: 0
        }, { transaction });
        await JournalLine.create({
            journalId: journal.id,
            accountId: incomeAccount.id,
            lineNumber: 2,
            description: `Penalty income for ${billing.billNumber}`,
            debitAmount: 0,
            creditAmount: penalty
        }, { transaction });
        await journal.update({ status: "POSTED", postedAt: new Date(), postedBy: null }, { transaction });

        await invoice.update({
            penaltyAmount: nextInvoicePenalty,
            totalAmount: nextInvoiceTotal,
            outstandingAmount: nextInvoiceOutstanding,
            status: "OVERDUE"
        }, { transaction });
        await billing.update({
            penaltyAmount: nextPenalty,
            totalAmount: nextTotal,
            outstandingAmount: nextOutstanding,
            status: "OVERDUE"
        }, { transaction });

        await transaction.commit();
        return { applied: true, penaltyAmount: penalty, penaltyEligibleDate, billing };
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        throw error;
    }
};


// =====================================================
// UPDATE OVERDUE
// =====================================================

const updateOverdueBills = async () => {

    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    const bills =
        await repository.findOverdueBills(
            today
        );


    let updatedCount = 0;


    for (
        const billing of bills
    ) {

        await billing.update({
            status: "OVERDUE"
        });

        updatedCount++;
    }


    return {
        updatedCount
    };
};


// =====================================================
// CANCEL BILLING
// =====================================================

const cancelBilling = async (
    id
) => {
    const initialBilling = await repository.findById(id);
    if (!initialBilling) throw new Error("Billing record not found");

    const transaction = await sequelize.transaction();
    try {
        let billing;
        let invoice = null;
        if (initialBilling.status === "DRAFT") {
            // Draft cancellation shares the bill-row lock order with issueBilling.
            billing = await repository.findById(id, transaction, true);
            if (!billing) throw new Error("Billing record not found");
            if (billing.status !== "DRAFT") {
                await transaction.rollback();
                return cancelBilling(id);
            }
            const unexpectedInvoice = await InvoiceRepository.findByBillingId(id, transaction);
            if (unexpectedInvoice) throw new Error("Draft billing has a linked invoice and must be reconciled before cancellation");
        } else {
            // Payment posting locks Payment, Unit scope, Invoice, then Billing.
            // Read and lock payment rows first to avoid racing settlement.
            const invoiceCandidate = await InvoiceRepository.findByBillingId(id, transaction);
            if (!invoiceCandidate) throw new Error("Issued billing has no linked invoice and must be reconciled before cancellation");
            const Payment = require("../payment/payment.model");
            const payments = await Payment.findAll({
                where: { invoiceId: invoiceCandidate.id },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (payments.some((payment) => ["SUCCESS", "VERIFIED", "REFUNDED"].includes(payment.status) || payment.journalId)) {
                throw new Error("Billing with a completed payment cannot be cancelled; use the existing refund or reversal workflow");
            }
            if (payments.some((payment) => payment.paymentChannel === "GATEWAY" && ["INITIATED", "PENDING", "VERIFICATION_PENDING"].includes(payment.status))) {
                throw new Error("A gateway payment is still in progress. Resolve that payment attempt before cancelling this bill");
            }
            for (const payment of payments) {
                if (payment.paymentChannel !== "GATEWAY" && ["INITIATED", "PENDING", "VERIFICATION_PENDING"].includes(payment.status)) {
                    await payment.update({ status: "CANCELLED", remarks: payment.remarks || `Cancelled with billing ${initialBilling.billNumber}` }, { transaction });
                }
            }

            // Payment posting locks Unit scope, Invoice, then Billing; follow
            // that order after taking the Payment row locks above.
            await InvoiceRepository.lockUnitFinancialScope(
                initialBilling.societyId,
                initialBilling.unitId,
                transaction
            );
            invoice = await InvoiceRepository.findById(invoiceCandidate.id, transaction, true);
            billing = await repository.findById(id, transaction, true);
            if (!billing || !invoice) throw new Error("Billing record or linked invoice not found");
            if (invoice.billingId !== billing.id || invoice.societyId !== billing.societyId || invoice.unitId !== billing.unitId) {
                throw new Error("Billing and linked invoice references do not match");
            }
        }

        if (billing.status === "PAID" || billing.status === "PARTIALLY_PAID") {
            throw new Error(`${billing.status === "PAID" ? "Paid" : "Partially paid"} billing cannot be cancelled`);
        }
        if (billing.status === "CANCELLED") throw new Error("Billing is already cancelled");
        if (invoice) {
            if (["PAID", "PARTIALLY_PAID"].includes(invoice.status) || Number(invoice.paidAmount || 0) > 0) {
                throw new Error("Paid or partially paid invoice cannot be cancelled");
            }
            const journals = await Journal.findAll({
                where: {
                    societyId: billing.societyId,
                    referenceId: billing.id,
                    referenceType: { [Op.in]: ["BILLING", "BILLING_PENALTY"] },
                    status: "POSTED",
                },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if ((billing.journalId || invoice.journalId) && !journals.some((journal) => journal.id === (billing.journalId || invoice.journalId))) {
                throw new Error("The billing journal could not be found; reconcile this bill before cancellation");
            }
            for (const journal of journals) {
                await journal.update({ status: "REVERSED" }, { transaction });
            }

            await invoice.update({
                status: "CANCELLED",
                outstandingAmount: 0,
                remarks: [invoice.remarks, `Cancelled with billing ${billing.billNumber}`].filter(Boolean).join("\n"),
            }, { transaction });
        }

        await billing.update({
            status: "CANCELLED",
            outstandingAmount: 0,
            remarks: [billing.remarks, `Billing cancelled${invoice ? ` with invoice ${invoice.invoiceNumber}` : ""}`].filter(Boolean).join("\n"),
        }, { transaction });
        await transaction.commit();
        return billing;
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        throw error;
    }
};


// =====================================================
// DELETE BILLING
// =====================================================

const deleteBilling = async (
    id
) => {
    const transaction = await sequelize.transaction();
    try {
        const billing = await repository.findById(id, transaction, true);
        if (!billing) throw new Error("Billing record not found");
        if (billing.status !== "CANCELLED") throw new Error("Only CANCELLED billing can be deleted");
        const linkedInvoice = await InvoiceRepository.findByBillingId(id, transaction);
        if (linkedInvoice) {
            const InvoiceItem = require("../invoice/invoiceItem.model");
            const InvoicePreviousBalanceSource = require("../invoice/invoicePreviousBalanceSource.model");
            const Payment = require("../payment/payment.model");
            const [payments, postedJournals, dependentBalances] = await Promise.all([
                Payment.findAll({ where: { invoiceId: linkedInvoice.id }, transaction, lock: transaction.LOCK.UPDATE }),
                Journal.findAll({
                    where: { societyId: billing.societyId, referenceType: { [Op.in]: ["BILLING", "BILLING_PENALTY"] }, referenceId: billing.id, status: "POSTED" },
                    transaction,
                    lock: transaction.LOCK.UPDATE,
                }),
                InvoicePreviousBalanceSource.findOne({ where: { sourceInvoiceId: linkedInvoice.id }, transaction, lock: transaction.LOCK.UPDATE }),
            ]);
            if (payments.some((payment) => ["SUCCESS", "VERIFIED", "REFUNDED"].includes(payment.status) || payment.journalId) || Number(linkedInvoice.paidAmount || 0) > 0) {
                throw new Error("Billing with completed payment history cannot be deleted");
            }
            if (postedJournals.length) throw new Error("Billing with posted accounting history cannot be deleted");
            if (dependentBalances) throw new Error("Invoice is referenced by another invoice balance and cannot be deleted");
            for (const payment of payments) await payment.update({ invoiceId: null }, { transaction });
            await InvoicePreviousBalanceSource.destroy({ where: { statementInvoiceId: linkedInvoice.id }, transaction });
            await InvoiceItem.destroy({ where: { invoiceId: linkedInvoice.id }, transaction });
            await linkedInvoice.destroy({ transaction });
        }
        await repository.deleteById(id, transaction);
        await transaction.commit();
        return { message: "Billing deleted successfully" };
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        throw error;
    }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    createBilling,

    calculateCompleteBilling,
    calculatePayableTotal,
    getPenaltyRuleSnapshot,

    issueBilling,

    getAll,

    getById,

    getByUnit,

    applyPenaltyToBill,

    updateOverdueBills,

    cancelBilling,

    deleteBilling

};
