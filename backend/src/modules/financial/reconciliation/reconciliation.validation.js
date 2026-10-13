const validateSociety = (
    societyId
) => {

    if (!societyId) {
        throw new Error(
            "societyId is required"
        );
    }
};


const validateAmount = (
    amount
) => {

    if (
        amount === undefined ||
        amount === null ||
        isNaN(amount)
    ) {
        throw new Error(
            "Valid amount is required"
        );
    }

    if (Number(amount) <= 0) {
        throw new Error(
            "Amount must be greater than 0"
        );
    }
};


const validateTransactionType = (
    transactionType
) => {

    if (
        ![
            "CREDIT",
            "DEBIT"
        ].includes(transactionType)
    ) {

        throw new Error(
            "transactionType must be CREDIT or DEBIT"
        );
    }
};


module.exports = {
    validateSociety,
    validateAmount,
    validateTransactionType
};