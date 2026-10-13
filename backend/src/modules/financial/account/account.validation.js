const ACCOUNT_TYPES = [
    "ASSET",
    "LIABILITY",
    "INCOME",
    "EXPENSE",
    "EQUITY",
    "RECEIVABLE"
];


const validateCreateAccount = (data) => {

    const errors = [];

    if (!data.societyId) {
        errors.push(
            "societyId is required"
        );
    }

    if (!data.accountCode) {
        errors.push(
            "accountCode is required"
        );
    }

    if (!data.accountName) {
        errors.push(
            "accountName is required"
        );
    }

    if (!data.accountType) {
        errors.push(
            "accountType is required"
        );
    }

    if (
        data.accountType &&
        !ACCOUNT_TYPES.includes(
            data.accountType
        )
    ) {
        errors.push(
            `accountType must be one of: ${ACCOUNT_TYPES.join(", ")}`
        );
    }

    return errors;
};


module.exports = {
    ACCOUNT_TYPES,
    validateCreateAccount
};