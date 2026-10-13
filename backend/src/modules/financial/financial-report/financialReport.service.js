const repository =
    require("./financialReport.repository");


const buildAccountBalances = ({
    accounts,
    journalLines
}) => {

    const accountMap = new Map();

    accounts.forEach(account => {

        accountMap.set(account.id, {
            accountId: account.id,
            accountCode: account.accountCode,
            accountName: account.accountName,
            accountType: account.accountType,

            debit: 0,
            credit: 0
        });

    });

    journalLines.forEach(line => {

        const account =
            accountMap.get(line.accountId);

        if (!account) {
            return;
        }

        account.debit +=
            Number(line.debitAmount || 0);

        account.credit +=
            Number(line.creditAmount || 0);
    });

    return Array.from(
        accountMap.values()
    ).map(account => {

        const debit =
            Number(account.debit.toFixed(2));

        const credit =
            Number(account.credit.toFixed(2));

        let balance = 0;
        let balanceType = null;

        if (debit > credit) {

            balance =
                Number((debit - credit).toFixed(2));

            balanceType = "DEBIT";

        } else if (credit > debit) {

            balance =
                Number((credit - debit).toFixed(2));

            balanceType = "CREDIT";
        }

        return {
            ...account,

            debit,
            credit,

            balance,
            balanceType
        };
    });
};


const getIncomeExpenseReport = async ({
    societyId,
    accountingPeriodId,
    startDate,
    endDate
}) => {

    if (!societyId) {
        throw new Error(
            "societyId is required"
        );
    }

    const {
        accounts,
        journalLines
    } = await repository.getPostedAccountingData({
        societyId,
        accountingPeriodId,
        startDate,
        endDate
    });

    const balances =
        buildAccountBalances({
            accounts,
            journalLines
        });

    const incomeAccounts =
        balances.filter(
            account =>
                account.accountType === "INCOME"
        );

    const expenseAccounts =
        balances.filter(
            account =>
                account.accountType === "EXPENSE"
        );

    const totalIncome =
        incomeAccounts.reduce(
            (total, account) =>
                total + account.balance,
            0
        );

    const totalExpense =
        expenseAccounts.reduce(
            (total, account) =>
                total + account.balance,
            0
        );

    const netIncome =
        totalIncome - totalExpense;

    return {

        societyId,

        accountingPeriodId:
            accountingPeriodId || null,

        startDate:
            startDate || null,

        endDate:
            endDate || null,

        income: incomeAccounts,

        expenses: expenseAccounts,

        totalIncome:
            Number(totalIncome.toFixed(2)),

        totalExpense:
            Number(totalExpense.toFixed(2)),

        netIncome:
            Number(netIncome.toFixed(2))
    };
};


const getBalanceSheet = async ({
    societyId,
    accountingPeriodId,
    startDate,
    endDate
}) => {

    if (!societyId) {
        throw new Error(
            "societyId is required"
        );
    }

    const {
        accounts,
        journalLines
    } = await repository.getPostedAccountingData({
        societyId,
        accountingPeriodId,
        startDate,
        endDate
    });

    const balances =
        buildAccountBalances({
            accounts,
            journalLines
        });

    const assets =
        balances.filter(
            account =>
                account.accountType === "ASSET" ||
                account.accountType === "RECEIVABLE"
        );

    const liabilities =
        balances.filter(
            account =>
                account.accountType === "LIABILITY"
        );

    const equity =
        balances.filter(
            account =>
                account.accountType === "EQUITY"
        );

    const income =
        balances.filter(
            account =>
                account.accountType === "INCOME"
        );

    const expenses =
        balances.filter(
            account =>
                account.accountType === "EXPENSE"
        );

    const totalAssets =
        assets.reduce(
            (total, account) =>
                total + account.balance,
            0
        );

    const totalLiabilities =
        liabilities.reduce(
            (total, account) =>
                total + account.balance,
            0
        );

    const totalEquity =
        equity.reduce(
            (total, account) =>
                total + account.balance,
            0
        );

    const totalIncome =
        income.reduce(
            (total, account) =>
                total + account.balance,
            0
        );

    const totalExpenses =
        expenses.reduce(
            (total, account) =>
                total + account.balance,
            0
        );

    const currentYearProfit =
        totalIncome - totalExpenses;

    const totalLiabilitiesAndEquity =
        totalLiabilities +
        totalEquity +
        currentYearProfit;

    return {

        societyId,

        accountingPeriodId:
            accountingPeriodId || null,

        startDate:
            startDate || null,

        endDate:
            endDate || null,

        assets,

        liabilities,

        equity,

        currentYearProfit:
            Number(
                currentYearProfit.toFixed(2)
            ),

        totalAssets:
            Number(
                totalAssets.toFixed(2)
            ),

        totalLiabilities:
            Number(
                totalLiabilities.toFixed(2)
            ),

        totalEquity:
            Number(
                totalEquity.toFixed(2)
            ),

        totalLiabilitiesAndEquity:
            Number(
                totalLiabilitiesAndEquity.toFixed(2)
            ),

        difference:
            Number(
                (
                    totalAssets -
                    totalLiabilitiesAndEquity
                ).toFixed(2)
            ),

        isBalanced:
            Number(
                (
                    totalAssets -
                    totalLiabilitiesAndEquity
                ).toFixed(2)
            ) === 0
    };
};


const getTrialBalanceSummary = async ({
    societyId,
    accountingPeriodId,
    startDate,
    endDate
}) => {

    const {
        accounts,
        journalLines
    } = await repository.getPostedAccountingData({
        societyId,
        accountingPeriodId,
        startDate,
        endDate
    });

    const balances =
        buildAccountBalances({
            accounts,
            journalLines
        });

    let totalDebit = 0;
    let totalCredit = 0;

    balances.forEach(account => {

        totalDebit += account.debit;
        totalCredit += account.credit;

    });

    totalDebit =
        Number(totalDebit.toFixed(2));

    totalCredit =
        Number(totalCredit.toFixed(2));

    const difference =
        Number(
            (totalDebit - totalCredit)
                .toFixed(2)
        );

    return {

        societyId,

        accountingPeriodId:
            accountingPeriodId || null,

        totalDebit,

        totalCredit,

        difference,

        isBalanced:
            difference === 0,

        accountCount:
            balances.length
    };
};


const getAccountReport = async ({
    societyId,
    accountId,
    accountingPeriodId,
    startDate,
    endDate
}) => {

    if (!societyId) {
        throw new Error(
            "societyId is required"
        );
    }

    if (!accountId) {
        throw new Error(
            "accountId is required"
        );
    }

    const {
        accounts,
        journalLines
    } = await repository.getPostedAccountingData({
        societyId,
        accountingPeriodId,
        startDate,
        endDate
    });

    const account =
        accounts.find(
            item => item.id === accountId
        );

    if (!account) {
        throw new Error(
            "Account not found for this society"
        );
    }

    const entries =
        journalLines
            .filter(
                line =>
                    line.accountId === accountId
            )
            .map(line => ({

                journalLineId:
                    line.id,

                journalId:
                    line.journalId,

                journalNumber:
                    line.journal?.journalNumber,

                transactionDate:
                    line.journal?.transactionDate,

                referenceType:
                    line.journal?.referenceType,

                referenceId:
                    line.journal?.referenceId,

                description:
                    line.description,

                debit:
                    Number(
                        line.debitAmount || 0
                    ),

                credit:
                    Number(
                        line.creditAmount || 0
                    )

            }));

    const totalDebit =
        entries.reduce(
            (total, entry) =>
                total + entry.debit,
            0
        );

    const totalCredit =
        entries.reduce(
            (total, entry) =>
                total + entry.credit,
            0
        );

    return {

        societyId,

        account: {
            id: account.id,
            code: account.accountCode,
            name: account.accountName,
            type: account.accountType
        },

        totalDebit:
            Number(totalDebit.toFixed(2)),

        totalCredit:
            Number(totalCredit.toFixed(2)),

        balance:
            Number(
                (
                    totalDebit -
                    totalCredit
                ).toFixed(2)
            ),

        entries
    };
};


module.exports = {

    getIncomeExpenseReport,

    getBalanceSheet,

    getTrialBalanceSummary,

    getAccountReport

};