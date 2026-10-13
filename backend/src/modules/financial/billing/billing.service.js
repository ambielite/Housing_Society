const { Op } = require("sequelize");

const sequelize =
    require("../../../config/database");

const repository =
    require("./billing.repository");

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
    billDate
) => {

    const previousBills =
        await repository.findOutstandingByUnit(
            societyId,
            unitId,
            billDate
        );


    let previousBalance = 0;


    for (
        const bill of previousBills
    ) {

        previousBalance +=
            Number(
                bill.outstandingAmount || 0
            );
    }


    return Number(
        previousBalance.toFixed(2)
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
    taxAmount = 0,
    penaltyAmount = 0
}) => {

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


    const previousBalance =
        await calculatePreviousBalance(
            societyId,
            unitId,
            billDate
        );


    const tax =
        Number(taxAmount || 0);

    const penalty =
        Number(penaltyAmount || 0);


    if (tax < 0) {
        throw new Error(
            "taxAmount cannot be negative"
        );
    }


    if (penalty < 0) {
        throw new Error(
            "penaltyAmount cannot be negative"
        );
    }


    const subtotal =
        Number(chargeAmount.toFixed(2));


    const totalAmount =
        Number(
            (
                subtotal +
                previousBalance +
                tax +
                penalty
            ).toFixed(2)
        );


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

const createBilling = async (
    data
) => {

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


    const totalAmount =
        Number(
            (
                calculatedData.subtotal +
                calculatedData.previousBalance +
                calculatedData.taxAmount +
                calculatedData.penaltyAmount
            ).toFixed(2)
        );


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
        });


    return billing;
};


// =====================================================
// ISSUE BILLING
// =====================================================

const issueBilling = async (
    id
) => {

    const transaction =
        await sequelize.transaction();


    try {

        const billing =
            await repository.findById(
                id,
                transaction
            );


        if (!billing) {
            throw new Error(
                "Billing record not found"
            );
        }


        if (
            billing.status !==
            "DRAFT"
        ) {
            throw new Error(
                "Only DRAFT billing can be issued"
            );
        }


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
                    totalAmount,

                totalCredit:
                    totalAmount,

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
                totalAmount,

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
                totalAmount

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


        await billing.update({

            status:
                "ISSUED",

            journalId:
                journal.id,

            outstandingAmount:
                totalAmount

        }, {
            transaction
        });


        await transaction.commit();


        return billing;

    } catch (error) {

        if (
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


    return repository.findAll(
        where
    );
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

    const billing =
        await repository.findById(
            id
        );


    if (!billing) {
        throw new Error(
            "Billing record not found"
        );
    }


    if (
        billing.status ===
        "PAID"
    ) {
        throw new Error(
            "Paid billing cannot be cancelled"
        );
    }


    if (
        billing.status ===
        "PARTIALLY_PAID"
    ) {
        throw new Error(
            "Partially paid billing cannot be cancelled"
        );
    }


    if (
        billing.status ===
        "CANCELLED"
    ) {
        throw new Error(
            "Billing is already cancelled"
        );
    }


    await billing.update({
        status: "CANCELLED"
    });


    return billing;
};


// =====================================================
// DELETE BILLING
// =====================================================

const deleteBilling = async (
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


    if (
        billing.status !==
        "DRAFT"
    ) {
        throw new Error(
            "Only DRAFT billing can be deleted"
        );
    }


    await repository.deleteById(
        id
    );


    return {
        message:
            "Billing deleted successfully"
    };
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    createBilling,

    calculateCompleteBilling,

    issueBilling,

    getAll,

    getById,

    getByUnit,

    updateOverdueBills,

    cancelBilling,

    deleteBilling

};