const { Op } = require("sequelize");

const Billing = require("./billing.model");

const create = async (
    data,
    transaction = null
) => {

    return Billing.create(
        data,
        transaction
            ? { transaction }
            : undefined
    );
};


const findAll = async (
    where = {}
) => {

    return Billing.findAll({
        where,

        order: [
            ["bill_date", "DESC"],
            ["created_at", "DESC"]
        ]
    });
};


const findById = async (
    id,
    transaction = null,
    lock = false
) => {

    return Billing.findByPk(
        id,
        transaction
            ? {
                transaction,
                ...(lock ? { lock: transaction.LOCK.UPDATE } : {})
            }
            : undefined
    );
};


const findByBillNumber = async (
    societyId,
    billNumber
) => {

    return Billing.findOne({
        where: {
            societyId,
            billNumber
        }
    });
};

const findIssuedMonthlyMaintenanceDuplicate = async ({
    societyId,
    unitId,
    memberId,
    billingPeriod,
    billingConfigId,
    excludeBillingId,
    transaction,
}) => {
    const where = {
        societyId,
        ...(memberId ? { memberId } : { unitId }),
        billingPeriod,
        billingConfigId,
        status: { [Op.in]: ["DRAFT", "ISSUED", "PARTIALLY_PAID", "OVERDUE", "PAID"] },
    };
    if (excludeBillingId) where.id = { [Op.ne]: excludeBillingId };
    return Billing.findOne({
        where,
        transaction,
        lock: transaction.LOCK.UPDATE,
    });
};

const lockMonthlyMaintenanceScope = async ({ societyId, memberId, unitId, billingPeriod, billingConfigId, transaction }) => {
    if (!transaction) throw new Error("A transaction is required to lock a monthly maintenance scope");
    const scope = `housing-society-monthly-maintenance:${societyId}:${billingConfigId}:${billingPeriod}`;
    const residentScopeId = memberId || unitId;
    await Billing.sequelize.query(
        "SELECT pg_advisory_xact_lock(hashtext(:scope), hashtext(:residentScopeId))",
        { replacements: { scope, residentScopeId }, transaction }
    );
};


const findByUnit = async (
    societyId,
    unitId
) => {

    return Billing.findAll({
        where: {
            societyId,
            unitId
        },

        order: [
            ["bill_date", "DESC"]
        ]
    });
};


const findOutstandingByUnit = async (
    societyId,
    unitId,
    billDate = null
) => {

    const where = {
        societyId,
        unitId,

        outstandingAmount: {
            [Op.gt]: 0
        },

        status: {
            [Op.in]: [
                "ISSUED",
                "PARTIALLY_PAID",
                "OVERDUE"
            ]
        }
    };

    if (billDate) {
        where.billDate = {
            [Op.lt]: billDate
        };
    }

    return Billing.findAll({
        where,

        order: [
            ["bill_date", "ASC"]
        ]
    });
};


const findOverdueBills = async (
    today
) => {

    return Billing.findAll({
        where: {
            dueDate: {
                [Op.lt]: today
            },

            outstandingAmount: {
                [Op.gt]: 0
            },

            status: {
                [Op.in]: [
                    "ISSUED",
                    "PARTIALLY_PAID"
                ]
            }
        }
    });
};


const update = async (
    id,
    data,
    transaction = null
) => {

    const billing =
        await Billing.findByPk(id);

    if (!billing) {
        return null;
    }

    await billing.update(
        data,
        transaction
            ? { transaction }
            : undefined
    );

    return billing;
};


const deleteById = async (
    id,
    transaction = null
) => {

    return Billing.destroy({
        where: {
            id
        },
        ...(transaction ? { transaction } : {})
    });
};


module.exports = {
    create,
    findAll,
    findById,
    findByBillNumber,
    findIssuedMonthlyMaintenanceDuplicate,
    lockMonthlyMaintenanceScope,
    findByUnit,
    findOutstandingByUnit,
    findOverdueBills,
    update,
    deleteById
};
