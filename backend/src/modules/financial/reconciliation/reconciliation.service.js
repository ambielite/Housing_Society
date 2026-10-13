const {
    Op
} = require("sequelize");

const ReconciliationRepository =
    require("./reconciliation.repository");

const Payment =
    require("../payment/payment.model");

const Invoice =
    require("../invoice/invoice.model");

const {
    validateSociety,
    validateAmount,
    validateTransactionType
} = require("./reconciliation.validation");


/*
|--------------------------------------------------------------------------
| Import Bank Transaction
|--------------------------------------------------------------------------
*/

const importTransaction = async (
    data
) => {

    validateSociety(
        data.societyId
    );

    validateAmount(
        data.amount
    );

    validateTransactionType(
        data.transactionType
    );

    if (!data.transactionReference) {

        throw new Error(
            "transactionReference is required"
        );
    }

    if (!data.transactionDate) {

        throw new Error(
            "transactionDate is required"
        );
    }


    /*
    Duplicate transaction reference
    */

    const existing =
        await ReconciliationRepository
            .findByTransactionReference(
                data.societyId,
                data.transactionReference
            );

    if (existing) {

        return {
            duplicate: true,
            reconciliation: existing
        };
    }


    /*
    Duplicate UTR
    */

    if (data.utrNumber) {

        const utrExisting =
            await ReconciliationRepository
                .findByUtr(
                    data.societyId,
                    data.utrNumber
                );

        if (utrExisting) {

            return {
                duplicate: true,
                reconciliation: utrExisting
            };
        }
    }


    const reconciliation =
        await ReconciliationRepository.create({
            societyId:
                data.societyId,

            transactionReference:
                data.transactionReference,

            transactionDate:
                data.transactionDate,

            valueDate:
                data.valueDate || null,

            transactionType:
                data.transactionType,

            amount:
                data.amount,

            bankName:
                data.bankName || null,

            bankAccountNumber:
                data.bankAccountNumber || null,

            description:
                data.description || null,

            utrNumber:
                data.utrNumber || null,

            status:
                "IMPORTED",

            metadata:
                data.metadata || null,

            remarks:
                data.remarks || null
        });


    return {
        duplicate: false,
        reconciliation
    };
};


/*
|--------------------------------------------------------------------------
| Find Matching Payments
|--------------------------------------------------------------------------
*/

const findMatchingPayments = async (
    reconciliation
) => {

    const amount =
        Number(reconciliation.amount);


    /*
    Bank CREDIT normally represents
    money received.
    */

    if (
        reconciliation.transactionType !==
        "CREDIT"
    ) {

        return [];
    }


    const date =
        new Date(
            reconciliation.transactionDate
        );


    const startDate =
        new Date(date);

    startDate.setDate(
        startDate.getDate() - 7
    );


    const endDate =
        new Date(date);

    endDate.setDate(
        endDate.getDate() + 7
    );


    const payments =
        await Payment.findAll({
            where: {

                societyId:
                    reconciliation.societyId,

                amount,

                paymentDate: {
                    [Op.between]: [
                        startDate,
                        endDate
                    ]
                },

                status: {
                    [Op.in]: [
                        "SUCCESS",
                        "VERIFIED"
                    ]
                }
            },

            order: [
                ["paymentDate", "DESC"]
            ]
        });


    return payments;
};


/*
|--------------------------------------------------------------------------
| Auto Match
|--------------------------------------------------------------------------
*/

const autoMatch = async (
    reconciliationId
) => {

    const reconciliation =
        await ReconciliationRepository
            .findById(
                reconciliationId
            );


    if (!reconciliation) {

        throw new Error(
            "Reconciliation transaction not found"
        );
    }


    if (
        reconciliation.status ===
        "RECONCILED"
    ) {

        return {
            matched: true,
            alreadyReconciled: true,
            reconciliation
        };
    }


    const payments =
        await findMatchingPayments(
            reconciliation
        );


    if (payments.length === 0) {

        await ReconciliationRepository.update(
            reconciliation,
            {
                status: "UNMATCHED"
            }
        );


        return {
            matched: false,
            message:
                "No matching payment found",
            reconciliation
        };
    }


    /*
    Exact unique match
    */

    if (payments.length === 1) {

        const payment =
            payments[0];


        await ReconciliationRepository.update(
            reconciliation,
            {
                paymentId:
                    payment.id,

                status:
                    "MATCHED",

                matchType:
                    "AUTO",

                matchedAt:
                    new Date()
            }
        );


        return {
            matched: true,
            matchType: "AUTO",
            payment,
            reconciliation
        };
    }


    /*
    Multiple matches
    */

    return {
        matched: false,

        multipleMatches: true,

        message:
            "Multiple payments found. Manual matching required",

        candidates:
            payments,

        reconciliation
    };
};


/*
|--------------------------------------------------------------------------
| Manual Match
|--------------------------------------------------------------------------
*/

const manualMatch = async (
    reconciliationId,
    paymentId,
    matchedBy
) => {

    const reconciliation =
        await ReconciliationRepository
            .findById(
                reconciliationId
            );


    if (!reconciliation) {

        throw new Error(
            "Reconciliation transaction not found"
        );
    }


    const payment =
        await Payment.findByPk(
            paymentId
        );


    if (!payment) {

        throw new Error(
            "Payment not found"
        );
    }


    if (
        payment.societyId !==
        reconciliation.societyId
    ) {

        throw new Error(
            "Payment and bank transaction belong to different societies"
        );
    }


    if (
        Number(payment.amount) !==
        Number(reconciliation.amount)
    ) {

        throw new Error(
            "Payment amount does not match bank transaction amount"
        );
    }


    if (
        ![
            "SUCCESS",
            "VERIFIED"
        ].includes(payment.status)
    ) {

        throw new Error(
            "Only successful or verified payments can be reconciled"
        );
    }


    await ReconciliationRepository.update(
        reconciliation,
        {
            paymentId:
                payment.id,

            status:
                "MATCHED",

            matchType:
                "MANUAL",

            matchedAt:
                new Date(),

            matchedBy:
                matchedBy || null
        }
    );


    return {
        matched: true,
        payment,
        reconciliation
    };
};


/*
|--------------------------------------------------------------------------
| Reconcile Transaction
|--------------------------------------------------------------------------
*/

const reconcile = async (
    reconciliationId,
    reconciledBy,
    remarks
) => {

    const reconciliation =
        await ReconciliationRepository
            .findById(
                reconciliationId
            );


    if (!reconciliation) {

        throw new Error(
            "Reconciliation transaction not found"
        );
    }


    if (!reconciliation.paymentId) {

        throw new Error(
            "Transaction must be matched to a payment before reconciliation"
        );
    }


    if (
        reconciliation.status ===
        "RECONCILED"
    ) {

        return {
            alreadyReconciled: true,
            reconciliation
        };
    }


    const payment =
        await Payment.findByPk(
            reconciliation.paymentId
        );


    if (!payment) {

        throw new Error(
            "Matched payment not found"
        );
    }


    if (
        Number(payment.amount) !==
        Number(reconciliation.amount)
    ) {

        throw new Error(
            "Payment amount does not match bank transaction"
        );
    }


    await ReconciliationRepository.update(
        reconciliation,
        {
            status:
                "RECONCILED",

            reconciledAt:
                new Date(),

            reconciledBy:
                reconciledBy || null,

            remarks:
                remarks ||
                reconciliation.remarks
        }
    );


    return {
        success: true,
        reconciliation
    };
};


/*
|--------------------------------------------------------------------------
| Get Reconciliation
|--------------------------------------------------------------------------
*/

const getById = async (
    id
) => {

    const reconciliation =
        await ReconciliationRepository
            .findById(id);


    if (!reconciliation) {

        throw new Error(
            "Reconciliation transaction not found"
        );
    }


    return reconciliation;
};


/*
|--------------------------------------------------------------------------
| Get All
|--------------------------------------------------------------------------
*/

const getAll = async (
    filters
) => {

    return await ReconciliationRepository
        .findAll(filters);
};


/*
|--------------------------------------------------------------------------
| Ignore Transaction
|--------------------------------------------------------------------------
*/

const ignoreTransaction = async (
    id,
    remarks
) => {

    const reconciliation =
        await ReconciliationRepository
            .findById(id);


    if (!reconciliation) {

        throw new Error(
            "Reconciliation transaction not found"
        );
    }


    if (
        reconciliation.status ===
        "RECONCILED"
    ) {

        throw new Error(
            "Reconciled transaction cannot be ignored"
        );
    }


    await ReconciliationRepository.update(
        reconciliation,
        {
            status:
                "IGNORED",

            remarks:
                remarks ||
                "Transaction ignored"
        }
    );


    return reconciliation;
};


module.exports = {
    importTransaction,
    findMatchingPayments,
    autoMatch,
    manualMatch,
    reconcile,
    getById,
    getAll,
    ignoreTransaction
};