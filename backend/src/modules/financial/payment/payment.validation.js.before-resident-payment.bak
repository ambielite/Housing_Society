const validateAmount = (amount) => {

    if (
        amount === undefined ||
        amount === null ||
        isNaN(amount)
    ) {
        throw new Error(
            "Valid payment amount is required"
        );
    }

    if (Number(amount) <= 0) {
        throw new Error(
            "Payment amount must be greater than 0"
        );
    }
};

const validateSociety = (societyId) => {

    if (!societyId) {
        throw new Error(
            "societyId is required"
        );
    }
};

const validateIdempotencyKey = (
    idempotencyKey
) => {

    if (!idempotencyKey) {
        throw new Error(
            "idempotencyKey is required"
        );
    }
};

const validatePaymentMethod = (
    paymentMethod
) => {

    const allowed = [
        "ONLINE",
        "CHEQUE",
        "NEFT",
        "RTGS",
        "BANK_TRANSFER",
        "CASH"
    ];

    if (!allowed.includes(paymentMethod)) {
        throw new Error(
            "Invalid payment method"
        );
    }
};

module.exports = {
    validateAmount,
    validateSociety,
    validateIdempotencyKey,
    validatePaymentMethod
};