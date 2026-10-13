const {
    Op
} = require("sequelize");

const Journal =
    require("../journal/journal.model");

const JournalLine =
    require("../journal/journalLine.model");

const Account =
    require("../account/account.model");

const AccountingPeriod =
    require("../accounting-period/accountingPeriod.model");

const fs =
    require("fs");

const path =
    require("path");


/*
|--------------------------------------------------------------------------
| Ensure Export Directory
|--------------------------------------------------------------------------
*/

const ensureExportDirectory = () => {

    const exportDirectory =
        path.join(
            process.cwd(),
            "uploads",
            "accounting-exports"
        );

    if (
        !fs.existsSync(
            exportDirectory
        )
    ) {

        fs.mkdirSync(
            exportDirectory,
            {
                recursive: true
            }
        );
    }

    return exportDirectory;
};


/*
|--------------------------------------------------------------------------
| Build Journal Where Condition
|--------------------------------------------------------------------------
*/

const buildJournalWhere = (
    data
) => {

    const where = {

        societyId:
            data.societyId,

        status:
            "POSTED"
    };


    if (
        data.accountingPeriodId
    ) {

        where.accountingPeriodId =
            data.accountingPeriodId;
    }


    if (
        data.startDate ||
        data.endDate
    ) {

        where.transactionDate = {};
    }


    if (
        data.startDate
    ) {

        where.transactionDate[
            Op.gte
        ] =
            data.startDate;
    }


    if (
        data.endDate
    ) {

        where.transactionDate[
            Op.lte
        ] =
            data.endDate;
    }


    return where;
};


/*
|--------------------------------------------------------------------------
| Get Posted Journal Data
|--------------------------------------------------------------------------
*/

const getJournalData = async (
    data
) => {

    if (!data.societyId) {

        throw new Error(
            "societyId is required"
        );
    }


    const journals =
        await Journal.findAll({

            where:
                buildJournalWhere(
                    data
                ),

            include: [
                {
                    model:
                        JournalLine,

                    as:
                        "lines",

                    required:
                        true,

                    include: [
                        {
                            model:
                                Account,

                            as:
                                "account",

                            required:
                                false
                        }
                    ]
                }
            ],

            order: [
                [
                    "transactionDate",
                    "ASC"
                ],
                [
                    "journalNumber",
                    "ASC"
                ]
            ]
        });


    return journals;
};


/*
|--------------------------------------------------------------------------
| Convert Journal Data
|--------------------------------------------------------------------------
*/

const convertJournalData = (
    journals
) => {

    const rows = [];


    for (
        const journal of journals
    ) {

        for (
            const line of journal.lines || []
        ) {

            rows.push({

                journalNumber:
                    journal.journalNumber,

                transactionDate:
                    journal.transactionDate,

                accountingPeriodId:
                    journal.accountingPeriodId,

                referenceType:
                    journal.referenceType,

                referenceId:
                    journal.referenceId,

                journalDescription:
                    journal.description,

                journalStatus:
                    journal.status,

                accountCode:
                    line.account
                        ?.accountCode ||
                    "",

                accountName:
                    line.account
                        ?.accountName ||
                    "",

                accountType:
                    line.account
                        ?.accountType ||
                    "",

                lineNumber:
                    line.lineNumber,

                lineDescription:
                    line.description,

                debitAmount:
                    Number(
                        line.debitAmount ||
                        0
                    ),

                creditAmount:
                    Number(
                        line.creditAmount ||
                        0
                    )
            });
        }
    }


    return rows;
};


/*
|--------------------------------------------------------------------------
| CSV Escape
|--------------------------------------------------------------------------
*/

const escapeCsvValue = (
    value
) => {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    const stringValue =
        String(value);


    if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
    ) {

        return `"${stringValue.replace(
            /"/g,
            '""'
        )}"`;
    }


    return stringValue;
};


/*
|--------------------------------------------------------------------------
| Convert Rows To CSV
|--------------------------------------------------------------------------
*/

const convertToCsv = (rows, fallbackHeaders = []) => {
    const headers = rows.length ? Object.keys(rows[0]) : fallbackHeaders;
    if (!headers.length) return "";
    const csvRows = [];


    csvRows.push(
        headers.join(",")
    );


    for (
        const row of rows
    ) {

        const values =
            headers.map(
                header =>
                    escapeCsvValue(
                        row[header]
                    )
            );


        csvRows.push(
            values.join(",")
        );
    }


    return csvRows.join("\n");
};


/*
|--------------------------------------------------------------------------
| Export Journal
|--------------------------------------------------------------------------
*/

const exportJournal = async (
    data,
    format = "json"
) => {

    const journals =
        await getJournalData(
            data
        );


    const rows =
        convertJournalData(
            journals
        );


    return createExportFile(
        rows,
        "journal",
        format
    );
};


/*
|--------------------------------------------------------------------------
| Export Trial Balance
|--------------------------------------------------------------------------
*/

const exportTrialBalance = async (
    data,
    format = "json"
) => {

    if (!data.societyId) {

        throw new Error(
            "societyId is required"
        );
    }


    const where =
        buildJournalWhere(
            data
        );


    const journals =
        await Journal.findAll({

            where,

            include: [
                {
                    model:
                        JournalLine,

                    as:
                        "lines",

                    required:
                        true
                }
            ]
        });


    const accountMap =
        new Map();


    for (
        const journal of journals
    ) {

        for (
            const line of journal.lines
        ) {

            const accountId =
                line.accountId;


            if (
                !accountMap.has(
                    accountId
                )
            ) {

                accountMap.set(
                    accountId,
                    {
                        accountId,

                        debit:
                            0,

                        credit:
                            0
                    }
                );
            }


            const account =
                accountMap.get(
                    accountId
                );


            account.debit +=
                Number(
                    line.debitAmount ||
                    0
                );


            account.credit +=
                Number(
                    line.creditAmount ||
                    0
                );
        }
    }


    const accountIds =
        Array.from(
            accountMap.keys()
        );


    const accounts =
        await Account.findAll({

            where: {

                societyId:
                    data.societyId,

                id: {
                    [Op.in]:
                        accountIds
                }
            }
        });


    const accountLookup =
        new Map();


    for (
        const account of accounts
    ) {

        accountLookup.set(
            account.id,
            account
        );
    }


    const rows = [];


    for (
        const item of accountMap.values()
    ) {

        const account =
            accountLookup.get(
                item.accountId
            );


        const debit =
            item.debit;


        const credit =
            item.credit;


        rows.push({

            accountCode:
                account?.accountCode ||
                "",

            accountName:
                account?.accountName ||
                "",

            accountType:
                account?.accountType ||
                "",

            totalDebit:
                debit,

            totalCredit:
                credit,

            balance:
                Math.abs(
                    debit - credit
                ),

            balanceType:
                debit >= credit
                    ? "DEBIT"
                    : "CREDIT"
        });
    }


    rows.sort(
        (a, b) =>
            a.accountCode.localeCompare(
                b.accountCode
            )
    );


    return createExportFile(
        rows,
        "trial-balance",
        format
    );
};


/*
|--------------------------------------------------------------------------
| Export General Ledger
|--------------------------------------------------------------------------
*/

const exportGeneralLedger = async (data, format = "json") => {
    if (!data.societyId) {
        throw new Error("societyId is required");
    }

    const journalWhere = buildJournalWhere(data);
    const lineWhere = data.accountId ? { accountId: data.accountId } : {};
    const journalLines = await JournalLine.findAll({
        where: lineWhere,
        include: [
            {
                model: Journal,
                as: "journal",
                required: true,
                where: journalWhere
            },
            {
                model: Account,
                as: "account",
                required: false
            }
        ],
        order: [
            [{ model: Journal, as: "journal" }, "transactionDate", "ASC"],
            [{ model: Journal, as: "journal" }, "journalNumber", "ASC"],
            ["lineNumber", "ASC"]
        ]
    });

    const balances = new Map();
    const rows = journalLines.map((line) => {
        const debit = Number(line.debitAmount || 0);
        const credit = Number(line.creditAmount || 0);
        const balance = (balances.get(line.accountId) || 0) + debit - credit;
        balances.set(line.accountId, balance);
        return {
            transactionDate: line.journal?.transactionDate,
            journalNumber: line.journal?.journalNumber,
            referenceType: line.journal?.referenceType,
            referenceId: line.journal?.referenceId,
            accountId: line.accountId,
            accountCode: line.account?.accountCode || "",
            accountName: line.account?.accountName || "",
            description: line.description,
            debitAmount: debit,
            creditAmount: credit,
            runningBalance: Number(balance.toFixed(2))
        };
    });

    return createExportFile(rows, "general-ledger", format);
};


const createExportFile = (rows, exportType, format) => {
    const exportDirectory = ensureExportDirectory();
    const timestamp = Date.now();
    const isCsv = String(format).toLowerCase() === "csv";
    const extension = isCsv ? "csv" : "json";
    const fallbackHeaders = exportType === "general-ledger"
        ? ["transactionDate", "journalNumber", "referenceType", "referenceId", "accountId", "accountCode", "accountName", "description", "debitAmount", "creditAmount", "runningBalance"]
        : [];
    const content = isCsv ? convertToCsv(rows, fallbackHeaders) : JSON.stringify(rows, null, 4);
    const fileName = `${exportType}-${timestamp}.${extension}`;
    const filePath = path.join(exportDirectory, fileName);
    fs.writeFileSync(filePath, content, "utf8");
    return { exportType, format: extension, fileName, filePath, relativePath: `/uploads/accounting-exports/${fileName}`, recordCount: rows.length };
};
module.exports = {
    exportJournal,
    exportTrialBalance,
    exportGeneralLedger
};


