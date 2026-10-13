const { Op } = require("sequelize");

const Payment =
    require("./payment.model");

const findById = async (id) => {
    return await Payment.findByPk(id);
};

const findByIdempotencyKey = async (
    societyId,
    idempotencyKey
) => {
    return await Payment.findOne({
        where: {
            societyId,
            idempotencyKey
        }
    });
};

const findByPaymentReference = async (
    societyId,
    paymentReference
) => {
    return await Payment.findOne({
        where: {
            societyId,
            paymentReference
        }
    });
};

const findByGatewayOrderId = async (
    gatewayOrderId
) => {
    return await Payment.findOne({
        where: {
            gatewayOrderId
        }
    });
};

const create = async (
    data,
    transaction = null
) => {
    return await Payment.create(
        data,
        transaction
            ? { transaction }
            : {}
    );
};

const update = async (
    payment,
    data,
    transaction = null
) => {
    return await payment.update(
        data,
        transaction
            ? { transaction }
            : {}
    );
};

const findAll = async ({
    societyId,
    status,
    paymentMethod,
    invoiceId
}) => {

    const where = {};

    if (societyId) {
        where.societyId = societyId;
    }

    if (status) {
        where.status = status;
    }

    if (paymentMethod) {
        where.paymentMethod = paymentMethod;
    }

    if (invoiceId) {
        where.invoiceId = invoiceId;
    }

    return await Payment.findAll({
        where,
        order: [
            ["createdAt", "DESC"]
        ]
    });
};

module.exports = {
    findById,
    findByIdempotencyKey,
    findByPaymentReference,
    findByGatewayOrderId,
    create,
    update,
    findAll
};