
const CommunityForum = require("./forum.model");

const create = async (data) => {
    return await CommunityForum.create(data);
};

const findAll = async (where = {}) => {
    return await CommunityForum.findAll({
        where,
        order: [["created_at", "DESC"]]
    });
};

const findById = async (id) => {
    return await CommunityForum.findByPk(id);
};

const findOne = async (where) => {
    return await CommunityForum.findOne({
        where
    });
};

const update = async (forum, data) => {
    return await forum.update(data);
};

const deleteForum = async (forum) => {
    return await forum.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    findOne,
    update,
    deleteForum
};

