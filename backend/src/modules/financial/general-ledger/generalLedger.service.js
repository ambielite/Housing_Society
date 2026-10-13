const repository = require("./generalLedger.repository");

const Account = require("../account/account.model");

const getGeneralLedger = async ({
    societyId,
    accountId,
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

    const lines = await repository.findPostedLines({
        societyId,
        accountId,
        accountingPeriodId,
        startDate,
        endDate
    });

    if (lines.length === 0) {
        return {
            societyId,
            accountId: accountId || null,
            totalDebit: 0,
            totalCredit: 0,
            closingBalance: 0,
            entries: []
        };
    }

    const accountIds = [
        ...new Set(
            lines.map(line => line.accountId)
        )
    ];

    const accounts = await Account.findAll({
        where: {
            id: accountIds,
            societyId
        },
        attributes: [
            "id",
            "accountCode",
            "accountName",
            "accountType",
            "parentAccountId"
        ]
    });

    const accountMap = new Map();

    accounts.forEach(account => {
        accountMap.set(
            account.id,
            account
        );
    });

    let totalDebit = 0;
    let totalCredit = 0;

    const entries = lines.map(line => {

        const debit = Number(
            line.debitAmount || 0
        );

        const credit = Number(
            line.creditAmount || 0
        );

        totalDebit += debit;
        totalCredit += credit;

        const account = accountMap.get(
            line.accountId
        );

        return {
            journalLineId: line.id,

            journalId: line.journalId,

            journalNumber:
                line.journal?.journalNumber || null,

            transactionDate:
                line.journal?.transactionDate || null,

            accountingPeriodId:
                line.journal?.accountingPeriodId || null,

            referenceType:
                line.journal?.referenceType || null,

            referenceId:
                line.journal?.referenceId || null,

            journalDescription:
                line.journal?.description || null,

            account: account
                ? {
                    id: account.id,
                    code: account.accountCode,
                    name: account.accountName,
                    type: account.accountType,
                    parentAccountId:
                        account.parentAccountId
                }
                : null,

            lineNumber: line.lineNumber,

            description: line.description,

            debit,

            credit
        };
    });

    return {
        societyId,
        accountId: accountId || null,

        totalDebit: Number(
            totalDebit.toFixed(2)
        ),

        totalCredit: Number(
            totalCredit.toFixed(2)
        ),

        closingBalance: Number(
            (totalDebit - totalCredit).toFixed(2)
        ),

        entries
    };
};


const getAccountLedger = async ({
    societyId,
    accountId,
    accountingPeriodId,
    startDate,
    endDate
}) => {

    if (!societyId) {
        throw new Error("societyId is required");
    }

    if (!accountId) {
        throw new Error("accountId is required");
    }

    const account = await Account.findOne({
        where: {
            id: accountId,
            societyId
        }
    });

    if (!account) {
        throw new Error(
            "Account not found for this society"
        );
    }

    const ledger = await getGeneralLedger({
        societyId,
        accountId,
        accountingPeriodId,
        startDate,
        endDate
    });

    return {
        ...ledger,

        account: {
            id: account.id,
            code: account.accountCode,
            name: account.accountName,
            type: account.accountType
        }
    };
};


const getAccountSummary = async ({
    societyId,
    accountId,
    accountingPeriodId,
    startDate,
    endDate
}) => {

    const ledger = await getAccountLedger({
        societyId,
        accountId,
        accountingPeriodId,
        startDate,
        endDate
    });

    const debit = Number(
        ledger.totalDebit || 0
    );

    const credit = Number(
        ledger.totalCredit || 0
    );

    return {
        societyId,

        account: ledger.account,

        totalDebit: Number(
            debit.toFixed(2)
        ),

        totalCredit: Number(
            credit.toFixed(2)
        ),

        netBalance: Number(
            (debit - credit).toFixed(2)
        ),

        transactionCount:
            ledger.entries.length
    };
};


const getPeriodLedger = async ({
    societyId,
    accountingPeriodId
}) => {

    if (!societyId) {
        throw new Error("societyId is required");
    }

    if (!accountingPeriodId) {
        throw new Error(
            "accountingPeriodId is required"
        );
    }

    return getGeneralLedger({
        societyId,
        accountingPeriodId
    });
};


module.exports = {
    getGeneralLedger,
    getAccountLedger,
    getAccountSummary,
    getPeriodLedger
};