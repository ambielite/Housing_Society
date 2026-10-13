const { Op } = require("sequelize");

const Account = require("../account/account.model");
const Journal = require("../journal/journal.model");
const JournalLine = require("../journal/journalLine.model");

const getPostedAccountingData = async ({
    societyId,
    accountingPeriodId,
    startDate,
    endDate
}) => {

    const journalWhere = {
        societyId,
        status: "POSTED"
    };

    if (accountingPeriodId) {
        journalWhere.accountingPeriodId =
            accountingPeriodId;
    }

    if (startDate || endDate) {

        journalWhere.transactionDate = {};

        if (startDate) {
            journalWhere.transactionDate[Op.gte] =
                startDate;
        }

        if (endDate) {
            journalWhere.transactionDate[Op.lte] =
                endDate;
        }
    }

    const accounts = await Account.findAll({
        where: {
            societyId
        },
        order: [
            ["accountCode", "ASC"]
        ]
    });

    const journalLines = await JournalLine.findAll({
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
                    "status"
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

    return {
        accounts,
        journalLines
    };
};

module.exports = {
    getPostedAccountingData
};