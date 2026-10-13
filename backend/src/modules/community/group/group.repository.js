
const CommunityGroup = require("./group.model");

const create = async (data) => {
    return await CommunityGroup.create(data);
};

const findAll = async (where = {}) => {
    return await CommunityGroup.findAll({
        where,
        order: [["created_at", "DESC"]]
    });
};

const findById = async (id) => {
    return await CommunityGroup.findByPk(id);
};

const findOne = async (where) => {
    return await CommunityGroup.findOne({
        where
    });
};

const update = async (group, data) => {
    return await group.update(data);
};

const deleteGroup = async (group) => {
    return await group.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    findOne,
    update,
    deleteGroup
};

