const { Op } = require("sequelize");

const sequelize = require("../../../config/database");

const Journal = require("./journal.model");
const JournalLine = require("./journalLine.model");

const AccountingPeriod = require("../accounting-period/accountingPeriod.model");
const Account = require("../account/account.model");

const repository = require("./journal.repository");


const createDraftJournal  = async (data) => {

    let transaction;

    try {

        const {
            societyId,
            transactionDate,
            description,
            referenceType,
            referenceId,
            remarks,
            lines
        } = data;


        // ----------------------------------------
        // 1. Validate journal lines
        // ----------------------------------------

        if (!lines || lines.length < 2) {
            throw new Error(
                "Journal must contain at least two lines"
            );
        }


        // ----------------------------------------
        // 2. Calculate debit and credit
        // ----------------------------------------

        let totalDebit = 0;
        let totalCredit = 0;

        for (const line of lines) {

            const debit =
                Number(line.debitAmount || 0);

            const credit =
                Number(line.creditAmount || 0);


            if (debit < 0 || credit < 0) {
                throw new Error(
                    "Debit and credit amounts cannot be negative"
                );
            }


            if (debit > 0 && credit > 0) {
                throw new Error(
                    "A journal line cannot have both debit and credit"
                );
            }


            if (debit === 0 && credit === 0) {
                throw new Error(
                    "A journal line must have either debit or credit"
                );
            }


            totalDebit += debit;
            totalCredit += credit;
        }


        // ----------------------------------------
        // 3. Check debit = credit
        // ----------------------------------------

        if (
            Number(totalDebit.toFixed(2)) !==
            Number(totalCredit.toFixed(2))
        ) {
            throw new Error(
                `Journal is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`
            );
        }


        if (totalDebit <= 0) {
            throw new Error(
                "Journal total must be greater than zero"
            );
        }


        // ----------------------------------------
        // 4. Start transaction
        // ----------------------------------------

        transaction =
            await sequelize.transaction();


        // ----------------------------------------
        // 5. Find OPEN accounting period
        // ----------------------------------------

        const accountingPeriod =
            await AccountingPeriod.findOne({

                where: {

                    societyId,

                    status: "OPEN",

                    startDate: {
                        [Op.lte]: transactionDate
                    },

                    endDate: {
                        [Op.gte]: transactionDate
                    }

                },

                transaction

            });


        if (!accountingPeriod) {

            throw new Error(
                "No OPEN accounting period found for the transaction date"
            );
        }


        // ----------------------------------------
        // 6. Validate accounts
        // ----------------------------------------

        const accountIds =
            lines.map(line => line.accountId);


        const accounts =
            await Account.findAll({

                where: {

                    id: {
                        [Op.in]: accountIds
                    },

                    societyId,

                    isActive: true

                },

                transaction

            });


        if (accounts.length !== accountIds.length) {

            throw new Error(
                "One or more accounts are invalid, inactive, or belong to another society"
            );
        }


        // ----------------------------------------
        // 7. Generate journal number
        // ----------------------------------------

        const journalNumber =
            `JV-${Date.now()}-${Math.floor(
                Math.random() * 1000
            )}`;


        // ----------------------------------------
        // 8. Create journal
        // ----------------------------------------

        const journal =
            await repository.createJournal(

                {

                    societyId,

                    accountingPeriodId:
                        accountingPeriod.id,

                    journalNumber,

                    transactionDate,

                    referenceType,

                    referenceId,

                    description,

                    status: "DRAFT",

                    totalDebit:
                        totalDebit.toFixed(2),

                    totalCredit:
                        totalCredit.toFixed(2),

                    remarks

                },

                transaction
            );


        // ----------------------------------------
        // 9. Create journal lines
        // ----------------------------------------

        const journalLines =
            lines.map((line, index) => ({

                journalId: journal.id,

                accountId: line.accountId,

                lineNumber: index + 1,

                description:
                    line.description || null,

                debitAmount:
                    Number(line.debitAmount || 0).toFixed(2),

                creditAmount:
                    Number(line.creditAmount || 0).toFixed(2)

            }));


        await repository.createJournalLines(
            journalLines,
            transaction
        );


        // ----------------------------------------
        // 10. Commit ONLY after everything succeeds
        // ----------------------------------------

        await transaction.commit();


        // ----------------------------------------
        // 11. Fetch after commit
        // ----------------------------------------

        return await repository.findById(
            journal.id
        );


    } catch (error) {

        // ----------------------------------------
        // Rollback ONLY if transaction is still active
        // ----------------------------------------

        if (
            transaction &&
            !transaction.finished
        ) {
            await transaction.rollback();
        }


        throw error;
    }
};

const isSchemaMissingError = (error) => {
    const message = error?.message || "";
    return /relation .* does not exist|column .* does not exist|table .* does not exist/i.test(message);
};

const deleteDraft = async (id) => {

    const journal =
        await repository.findById(id);

    if (!journal) {
        throw new Error("Journal not found");
    }

    if (journal.status !== "DRAFT") {
        throw new Error("Only DRAFT journals can be deleted");
    }

    await repository.deleteJournal(id);

    return true;
};


const getAll = async (filters = {}) => {

    try {
        const normalizedFilters =
            typeof filters === "object" && filters !== null
                ? filters
                : { societyId: filters };

        return await repository.findAll(
            normalizedFilters.societyId || null
        );
    } catch (error) {
        if (isSchemaMissingError(error)) {
            return [];
        }

        throw error;
    }
};


const getById = async (id) => {

    try {
        const journal =
            await repository.findById(id);

        if (!journal) {
            throw new Error("Journal not found");
        }

        return journal;
    } catch (error) {
        if (isSchemaMissingError(error)) {
            return null;
        }

        throw error;
    }
};


const getByPeriod = async (accountingPeriodId) => {

    if (!accountingPeriodId) {
        throw new Error("accountingPeriodId is required");
    }

    try {
        return await repository.findByPeriod(accountingPeriodId);
    } catch (error) {
        if (isSchemaMissingError(error)) {
            return [];
        }

        throw error;
    }
};


const getByStatus = async (societyId, status) => {

    if (!societyId) {
        throw new Error("societyId is required");
    }

    if (!status) {
        throw new Error("status is required");
    }

    try {
        return await repository.findByStatus(societyId, status);
    } catch (error) {
        if (isSchemaMissingError(error)) {
            return [];
        }

        throw error;
    }
};


module.exports = {
    createDraftJournal,
    getAll,
    getById,
    getByPeriod,
    getByStatus,
    deleteDraft
};