const { Op } = require("sequelize");

const Journal = require("../journal/journal.model");
const JournalLine = require("../journal/journalLine.model");

const findPostedLines = async ({
    societyId,
    accountId,
    accountingPeriodId,
    startDate,
    endDate
}) => {

    const journalWhere = {
        societyId,
        status: "POSTED"
    };

    if (accountingPeriodId) {
        journalWhere.accountingPeriodId = accountingPeriodId;
    }

    if (startDate || endDate) {

        journalWhere.transactionDate = {};

        if (startDate) {
            journalWhere.transactionDate[Op.gte] = startDate;
        }

        if (endDate) {
            journalWhere.transactionDate[Op.lte] = endDate;
        }
    }

    const lineWhere = {};

    if (accountId) {
        lineWhere.accountId = accountId;
    }

    const lines = await JournalLine.findAll({
        where: lineWhere,
        include: [
            {
                model: Journal,
                as: "journal",
                required: true,
                where: journalWhere,
                attributes: [
                    "id",
                    "societyId",
                    "accountingPeriodId",
                    "journalNumber",
                    "transactionDate",
                    "referenceType",
                    "referenceId",
                    "description",
                    "status",
                    "postedAt",
                    "postedBy"
                ]
            }
        ],
        order: [
            [
                { model: Journal, as: "journal" },
                "transactionDate",
                "ASC"
            ],
            ["lineNumber", "ASC"]
        ]
    });

    return lines;
};

module.exports = {
    findPostedLines
};