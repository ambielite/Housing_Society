const {
    Op
} = require("sequelize");

const Tax =
    require("./tax.model");


const findById = async (id) => {

    return await Tax.findByPk(id);
};


const findByCode = async (
    societyId,
    taxCode
) => {

    return await Tax.findOne({
        where: {
            societyId,
            taxCode
        }
    });
};


const create = async (
    data,
    transaction = null
) => {

    return await Tax.create(
        data,
        transaction
            ? { transaction }
            : {}
    );
};


const update = async (
    tax,
    data,
    transaction = null
) => {

    return await tax.update(
        data,
        transaction
            ? { transaction }
            : {}
    );
};


const findAll = async ({
    societyId,
    taxType,
    isActive
}) => {

    const where = {};

    if (societyId) {
        where.societyId = societyId;
    }

    if (taxType) {
        where.taxType = taxType;
    }

    if (
        isActive !== undefined
    ) {
        where.isActive =
            isActive === "true" ||
            isActive === true;
    }

    return await Tax.findAll({
        where,

        order: [
            ["createdAt", "DESC"]
        ]
    });
};


const findEffectiveTaxes = async (
    societyId,
    date
) => {

    return await Tax.findAll({
        where: {

            societyId,

            isActive: true,

            effectiveFrom: {
                [Op.lte]: date
            },

            [Op.or]: [
                {
                    effectiveTo: null
                },
                {
                    effectiveTo: {
                        [Op.gte]: date
                    }
                }
            ]
        }
    });
};


module.exports = {
    findById,
    findByCode,
    create,
    update,
    findAll,
    findEffectiveTaxes
};