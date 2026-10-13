const BillingConfig = require("./billingConfig.model");

const create = async (data) => {
    return BillingConfig.create(data);
};

const findAll = async (where = {}) => {
    return BillingConfig.findAll({
        where,
        order: [
            ["created_at", "DESC"]
        ]
    });
};

const findById = async (id) => {
    return BillingConfig.findByPk(id);
};

const findByCode = async (
    societyId,
    configType,
    code
) => {
    return BillingConfig.findOne({
        where: {
            societyId,
            configType,
            code
        }
    });
};

const update = async (id, data) => {
    const config = await BillingConfig.findByPk(id);

    if (!config) {
        return null;
    }

    await config.update(data);

    return config;
};

const deleteById = async (id) => {
    return BillingConfig.destroy({
        where: { id }
    });
};

module.exports = {
    create,
    findAll,
    findById,
    findByCode,
    update,
    deleteById
};