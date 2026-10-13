
const CommunityPost = require("./post.model");

const create = async (data) => {
    return await CommunityPost.create(data);
};

const findAll = async (where = {}) => {
    return await CommunityPost.findAll({
        where,
        order: [
            ["isPinned", "DESC"],
            ["created_at", "DESC"]
        ]
    });
};

const findById = async (id) => {
    return await CommunityPost.findByPk(id);
};

const update = async (post, data) => {
    return await post.update(data);
};

const deletePost = async (post) => {
    return await post.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    deletePost
};

