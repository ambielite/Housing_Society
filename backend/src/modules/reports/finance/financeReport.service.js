const { Op } = require("sequelize");

const Society = require("../../../modules/societies/society/society.model");

const Payment = require("../../../modules/financial/payment/payment.model");

const Reconciliation = require(
    "../../../modules/financial/reconciliation/reconciliation.model"
);

const LedgerAccount = require(
    "../../../modules/financial/ledger-account/ledgerAccount.model"
);

const Journal = require(
    "../../../modules/financial/journal/journal.model"
);

const {
    validateSocietyId,
    validateDateRange
} = require("./financeReport.validation");


/*
|--------------------------------------------------------------------------
| Helper
|--------------------------------------------------------------------------
*/

const buildDateFilter = (field, fromDate, toDate) => {

    const filter = {};

    if (fromDate && toDate) {
        filter[field] = {
            [Op.between]: [fromDate, toDate]
        };
    }
    else if (fromDate) {
        filter[field] = {
            [Op.gte]: fromDate
        };
    }
    else if (toDate) {
        filter[field] = {
            [Op.lte]: toDate
        };
    }

    return filter;
};


/*
|--------------------------------------------------------------------------
| Society Validation
|--------------------------------------------------------------------------
*/

const validateSociety = async (societyId) => {

    const society = await Society.findByPk(societyId);

    if (!society) {
        throw new Error("Society not found");
    }

    return society;
};


/*
|--------------------------------------------------------------------------
| 1. Bank Balance
|--------------------------------------------------------------------------
*/

const getBankBalance = async ({
    societyId,
    fromDate,
    toDate
}) => {

    validateSocietyId(societyId);

    validateDateRange(
        fromDate,
        toDate
    );

    await validateSociety(societyId);


    const where = {
        societyId,
        status: "RECONCILED",
        ...buildDateFilter(
            "transactionDate",
            fromDate,
            toDate
        )
    };


    const transactions =
        await Reconciliation.findAll({
            where,
            attributes: [
                "transactionType",
                "amount"
            ]
        });


    let totalCredit = 0;
    let totalDebit = 0;


    for (const transaction of transactions) {

        const amount =
            Number(transaction.amount) || 0;


        if (
            transaction.transactionType ===
            "CREDIT"
        ) {
            totalCredit += amount;
        }


        if (
            transaction.transactionType ===
            "DEBIT"
        ) {
            totalDebit += amount;
        }
    }


    const bankMovement =
        totalCredit - totalDebit;


    return {

        totalCredit:
            Number(totalCredit.toFixed(2)),

        totalDebit:
            Number(totalDebit.toFixed(2)),

        bankMovement:
            Number(bankMovement.toFixed(2)),

        transactionCount:
            transactions.length
    };
};


/*
|--------------------------------------------------------------------------
| 2. Collection
|--------------------------------------------------------------------------
*/

const getCollection = async ({
    societyId,
    fromDate,
    toDate
}) => {

    validateSocietyId(societyId);

    validateDateRange(
        fromDate,
        toDate
    );

    await validateSociety(societyId);


    const where = {

        societyId,

        status: {
            [Op.in]: [
                "SUCCESS",
                "VERIFIED"
            ]
        },

        ...buildDateFilter(
            "paymentDate",
            fromDate,
            toDate
        )
    };


    const payments =
        await Payment.findAll({
            where,
            attributes: [
                "amount",
                "paymentMethod",
                "paymentDate"
            ],
            order: [
                [
                    "paymentDate",
                    "ASC"
                ]
            ]
        });


    let totalCollection = 0;

    const byPaymentMethod = {};


    for (const payment of payments) {

        const amount =
            Number(payment.amount) || 0;


        totalCollection += amount;


        const method =
            payment.paymentMethod ||
            "UNKNOWN";


        if (!byPaymentMethod[method]) {
            byPaymentMethod[method] = 0;
        }


        byPaymentMethod[method] += amount;
    }


    for (const method of Object.keys(
        byPaymentMethod
    )) {

        byPaymentMethod[method] =
            Number(
                byPaymentMethod[method]
                    .toFixed(2)
            );
    }


    return {

        totalCollection:
            Number(
                totalCollection.toFixed(2)
            ),

        paymentCount:
            payments.length,

        byPaymentMethod
    };
};


/*
|--------------------------------------------------------------------------
| 3. Arrears
|--------------------------------------------------------------------------
*/

const getArrears = async ({
    societyId
}) => {

    validateSocietyId(societyId);

    await validateSociety(societyId);


    /*
     * Ledger accounts connected to a unit/member
     * are treated as resident/customer ledgers.
     *
     * CREDIT balance is considered outstanding
     * for this reporting layer.
     */

    const ledgers =
        await LedgerAccount.findAll({

            where: {
                societyId,

                isActive: true,

                [Op.or]: [
                    {
                        unitId: {
                            [Op.ne]: null
                        }
                    },
                    {
                        memberId: {
                            [Op.ne]: null
                        }
                    }
                ]
            },

            attributes: [
                "id",
                "unitId",
                "memberId",
                "ledgerCode",
                "ledgerName",
                "currentBalance",
                "balanceType"
            ]
        });


    let totalArrears = 0;

    let accountCount = 0;


    const accountDetails = [];


    for (const ledger of ledgers) {

        const balance =
            Number(
                ledger.currentBalance
            ) || 0;


        /*
         * Only CREDIT balances are counted
         * as outstanding in this first version.
         */

        if (
            ledger.balanceType ===
            "CREDIT" &&
            balance > 0
        ) {

            totalArrears += balance;

            accountCount++;


            accountDetails.push({

                ledgerId:
                    ledger.id,

                unitId:
                    ledger.unitId,

                memberId:
                    ledger.memberId,

                ledgerCode:
                    ledger.ledgerCode,

                ledgerName:
                    ledger.ledgerName,

                outstanding:
                    Number(
                        balance.toFixed(2)
                    )
            });
        }
    }


    return {

        totalArrears:
            Number(
                totalArrears.toFixed(2)
            ),

        accountCount,

        accounts:
            accountDetails
    };
};


/*
|--------------------------------------------------------------------------
| 4. Income vs Expense
|--------------------------------------------------------------------------
*/

const getIncomeExpense = async ({
    societyId,
    fromDate,
    toDate
}) => {

    validateSocietyId(societyId);

    validateDateRange(
        fromDate,
        toDate
    );

    await validateSociety(societyId);


    const where = {

        societyId,

        status: "POSTED",

        ...buildDateFilter(
            "transactionDate",
            fromDate,
            toDate
        )
    };


    const journals =
        await Journal.findAll({

            where,

            attributes: [
                "id",
                "transactionDate",
                "totalDebit",
                "totalCredit"
            ],

            order: [
                [
                    "transactionDate",
                    "ASC"
                ]
            ]
        });


    let totalDebit = 0;

    let totalCredit = 0;


    for (const journal of journals) {

        totalDebit +=
            Number(
                journal.totalDebit
            ) || 0;


        totalCredit +=
            Number(
                journal.totalCredit
            ) || 0;
    }


    const netMovement =
        totalCredit - totalDebit;


    return {

        totalIncome:
            Number(
                totalCredit.toFixed(2)
            ),

        totalExpense:
            Number(
                totalDebit.toFixed(2)
            ),

        netMovement:
            Number(
                netMovement.toFixed(2)
            ),

        journalCount:
            journals.length,

        /*
         * Important:
         * These values are posted journal
         * credit/debit totals.
         *
         * Exact income/expense classification
         * can later be improved using the
         * Account master/account type.
         */

        classification:
            "POSTED_JOURNAL_CREDIT_DEBIT"
    };
};


/*
|--------------------------------------------------------------------------
| 5. Complete Finance Dashboard
|--------------------------------------------------------------------------
*/

const getFinanceDashboard = async ({
    societyId,
    fromDate,
    toDate
}) => {

    validateSocietyId(societyId);

    validateDateRange(
        fromDate,
        toDate
    );


    const [
        bankBalance,
        collection,
        arrears,
        incomeExpense
    ] = await Promise.all([

        getBankBalance({
            societyId,
            fromDate,
            toDate
        }),

        getCollection({
            societyId,
            fromDate,
            toDate
        }),

        getArrears({
            societyId
        }),

        getIncomeExpense({
            societyId,
            fromDate,
            toDate
        })

    ]);


    return {

        societyId,

        period: {
            fromDate:
                fromDate || null,

            toDate:
                toDate || null
        },

        bankBalance,

        collection,

        arrears,

        incomeExpense
    };
};


module.exports = {

    getBankBalance,

    getCollection,

    getArrears,

    getIncomeExpense,

    getFinanceDashboard

};