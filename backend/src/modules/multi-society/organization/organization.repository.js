const Organization = require("./organization.model");

const create = async (data) => {
    return await Organization.create(data);
};

const findAll = async () => {
    return await Organization.findAll({
        order: [["created_at", "DESC"]]
    });
};

const findById = async (id) => {
    return await Organization.findByPk(id);
};

const findByCode = async (code) => {
    return await Organization.findOne({
        where: {
            code
        }
    });
};

const update = async (organization, data) => {
    return await organization.update(data);
};

const remove = async (organization) => {
    return await organization.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    findByCode,
    update,
    remove
};