const { Op } = require("sequelize");

const Journal = require("../journal/journal.model");
const JournalLine = require("../journal/journalLine.model");
const Account = require("../account/account.model");

const getTrialBalanceData = async ({
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

    const lines = await JournalLine.findAll({
        include: [
            {
                model: Journal,
                as: "journal",
                required: true,
                where: journalWhere,
                attributes: [
                    "id",
                    "accountingPeriodId",
                    "transactionDate",
                    "status"
                ]
            }
        ]
    });

    return {
        accounts,
        lines
    };
};

module.exports = {
    getTrialBalanceData
};