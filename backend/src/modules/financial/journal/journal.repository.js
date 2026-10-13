const Journal = require("./journal.model");
const JournalLine = require("./journalLine.model");


const createJournal = async (
    data,
    transaction = null
) => {

    return await Journal.create(
        data,
        {
            transaction
        }
    );

};


const createJournalLine = async (
    data,
    transaction = null
) => {

    return await JournalLine.create(
        data,
        {
            transaction
        }
    );

};


const createJournalLines = async (
    data,
    transaction = null
) => {

    return await JournalLine.bulkCreate(
        data,
        {
            transaction
        }
    );

};


const findById = async (
    id,
    transaction = null
) => {

    return await Journal.findByPk(
        id,
        {
            transaction,

            include: [
                {
                    model: JournalLine,
                    as: "lines"
                }
            ]
        }
    );

};


const findJournalOnly = async (
    id,
    transaction = null
) => {

    return await Journal.findByPk(
        id,
        {
            transaction
        }
    );

};


const findAll = async (
    societyId,
    transaction = null
) => {

    const where = {};

    if (societyId) {
        where.societyId = societyId;
    }

    return await Journal.findAll({

        where,

        transaction,

        include: [
            {
                model: JournalLine,
                as: "lines"
            }
        ],

        order: [
            ["transactionDate", "DESC"],
            ["created_at", "DESC"]
        ]

    });

};


const findByPeriod = async (
    accountingPeriodId,
    transaction = null
) => {

    return await Journal.findAll({

        where: {
            accountingPeriodId
        },

        transaction,

        include: [
            {
                model: JournalLine,
                as: "lines"
            }
        ],

        order: [
            ["transactionDate", "ASC"]
        ]

    });

};


const findByStatus = async (
    societyId,
    status,
    transaction = null
) => {

    return await Journal.findAll({

        where: {
            societyId,
            status
        },

        transaction,

        include: [
            {
                model: JournalLine,
                as: "lines"
            }
        ],

        order: [
            ["transactionDate", "DESC"]
        ]

    });

};


const findLinesByJournal = async (
    journalId,
    transaction = null
) => {

    return await JournalLine.findAll({

        where: {
            journalId
        },

        transaction,

        order: [
            ["lineNumber", "ASC"]
        ]

    });

};


const updateJournal = async (
    id,
    data,
    transaction = null
) => {

    const journal =
        await Journal.findByPk(
            id,
            {
                transaction
            }
        );

    if (!journal) {
        return null;
    }

    await journal.update(
        data,
        {
            transaction
        }
    );

    return journal;

};


const deleteJournalLines = async (
    journalId,
    transaction = null
) => {

    return await JournalLine.destroy({

        where: {
            journalId
        },

        transaction

    });

};


const deleteJournal = async (
    id,
    transaction = null
) => {

    const journal =
        await Journal.findByPk(
            id,
            {
                transaction
            }
        );

    if (!journal) {
        return null;
    }

    await journal.destroy({
        transaction
    });

    return journal;

};


module.exports = {

    createJournal,
    createJournalLine,
    createJournalLines,

    findById,
    findJournalOnly,
    findAll,
    findByPeriod,
    findByStatus,
    findLinesByJournal,

    updateJournal,

    deleteJournalLines,
    deleteJournal

};