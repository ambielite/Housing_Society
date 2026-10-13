const Reconciliation =
    require("./reconciliation.model");

const Payment =
    require("../payment/payment.model");


const findById = async (id) => {

    return await Reconciliation.findByPk(id);
};


const findByTransactionReference = async (
    societyId,
    transactionReference
) => {

    return await Reconciliation.findOne({
        where: {
            societyId,
            transactionReference
        }
    });
};


const findByUtr = async (
    societyId,
    utrNumber
) => {

    if (!utrNumber) {
        return null;
    }

    return await Reconciliation.findOne({
        where: {
            societyId,
            utrNumber
        }
    });
};


const findByPaymentId = async (
    paymentId
) => {

    return await Reconciliation.findOne({
        where: {
            paymentId
        }
    });
};


const create = async (
    data,
    transaction = null
) => {

    return await Reconciliation.create(
        data,
        transaction
            ? { transaction }
            : {}
    );
};


const update = async (
    reconciliation,
    data,
    transaction = null
) => {

    return await reconciliation.update(
        data,
        transaction
            ? { transaction }
            : {}
    );
};


const findAll = async ({
    societyId,
    status,
    transactionType
}) => {

    const where = {};

    if (societyId) {
        where.societyId = societyId;
    }

    if (status) {
        where.status = status;
    }

    if (transactionType) {
        where.transactionType =
            transactionType;
    }

    return await Reconciliation.findAll({
        where,

        order: [
            ["transactionDate", "DESC"],
            ["createdAt", "DESC"]
        ]
    });
};


module.exports = {
    findById,
    findByTransactionReference,
    findByUtr,
    findByPaymentId,
    create,
    update,
    findAll
};