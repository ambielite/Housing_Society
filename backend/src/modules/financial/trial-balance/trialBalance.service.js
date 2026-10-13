const repository =
    require("./trialBalance.repository");

const getTrialBalance = async ({
    societyId,
    accountingPeriodId,
    startDate,
    endDate
}) => {

    if (!societyId) {
        throw new Error("societyId is required");
    }

    if (startDate && endDate && startDate > endDate) {
        throw new Error(
            "startDate cannot be greater than endDate"
        );
    }

    const {
        accounts,
        lines
    } = await repository.getTrialBalanceData({
        societyId,
        accountingPeriodId,
        startDate,
        endDate
    });

    const accountMap = new Map();

    accounts.forEach(account => {

        accountMap.set(account.id, {
            accountId: account.id,
            accountCode: account.accountCode,
            accountName: account.accountName,
            accountType: account.accountType,
            totalDebit: 0,
            totalCredit: 0
        });

    });

    lines.forEach(line => {

        const account =
            accountMap.get(line.accountId);

        if (!account) {
            return;
        }

        account.totalDebit +=
            Number(line.debitAmount || 0);

        account.totalCredit +=
            Number(line.creditAmount || 0);
    });

    const entries = [];

    let totalDebit = 0;
    let totalCredit = 0;

    accountMap.forEach(account => {

        const debit =
            Number(account.totalDebit.toFixed(2));

        const credit =
            Number(account.totalCredit.toFixed(2));

        // Skip accounts with no transactions
        if (debit === 0 && credit === 0) {
            return;
        }

        totalDebit += debit;
        totalCredit += credit;

        entries.push({
            accountId: account.accountId,
            accountCode: account.accountCode,
            accountName: account.accountName,
            accountType: account.accountType,
            debit,
            credit
        });
    });

    totalDebit =
        Number(totalDebit.toFixed(2));

    totalCredit =
        Number(totalCredit.toFixed(2));

    const difference =
        Number(
            (totalDebit - totalCredit).toFixed(2)
        );

    return {
        societyId,

        accountingPeriodId:
            accountingPeriodId || null,

        startDate:
            startDate || null,

        endDate:
            endDate || null,

        entries,

        totalDebit,

        totalCredit,

        difference,

        isBalanced:
            difference === 0
    };
};

module.exports = {
    getTrialBalance
};