const CommunityClassified = require("./classified.model");

const create = async (data) => {
    return await CommunityClassified.create(data);
};

const findAll = async (where = {}) => {
    return await CommunityClassified.findAll({
        where,
        order: [
            ["created_at", "DESC"]
        ]
    });
};

const findById = async (id) => {
    return await CommunityClassified.findByPk(id);
};

const update = async (classified, data) => {
    return await classified.update(data);
};

const deleteClassified = async (classified) => {
    return await classified.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    deleteClassified
};