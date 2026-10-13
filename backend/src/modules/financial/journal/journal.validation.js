const validateJournal = (data) => {

    const errors = [];

    if (!data.societyId) {
        errors.push(
            "societyId is required"
        );
    }

    if (!data.transactionDate) {
        errors.push(
            "transactionDate is required"
        );
    }

    if (!data.description) {
        errors.push(
            "description is required"
        );
    }

    if (
        !Array.isArray(data.lines) ||
        data.lines.length < 2
    ) {
        errors.push(
            "At least two journal lines are required"
        );
    }

    return errors;

};


const validateJournalLines = (lines) => {

    const errors = [];

    if (
        !Array.isArray(lines) ||
        lines.length < 2
    ) {
        errors.push(
            "At least two journal lines are required"
        );

        return errors;
    }


    lines.forEach((line, index) => {

        const lineNumber =
            index + 1;

        if (!line.accountId) {

            errors.push(
                `Line ${lineNumber}: accountId is required`
            );

        }


        const debit =
            Number(line.debitAmount || 0);

        const credit =
            Number(line.creditAmount || 0);


        if (debit < 0) {

            errors.push(
                `Line ${lineNumber}: debitAmount cannot be negative`
            );

        }


        if (credit < 0) {

            errors.push(
                `Line ${lineNumber}: creditAmount cannot be negative`
            );

        }


        if (debit > 0 && credit > 0) {

            errors.push(
                `Line ${lineNumber}: cannot have both debit and credit`
            );

        }


        if (debit === 0 && credit === 0) {

            errors.push(
                `Line ${lineNumber}: debit or credit amount is required`
            );

        }

    });


    return errors;

};


module.exports = {

    validateJournal,
    validateJournalLines

};