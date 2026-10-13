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
    transaction = null
) => {

    return Billing.findByPk(
        id,
        transaction
            ? { transaction }
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
    id
) => {

    return Billing.destroy({
        where: {
            id
        }
    });
};


module.exports = {
    create,
    findAll,
    findById,
    findByBillNumber,
    findByUnit,
    findOutstandingByUnit,
    findOverdueBills,
    update,
    deleteById
};