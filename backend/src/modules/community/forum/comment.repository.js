
const CommunityComment = require("./comment.model");

const create = async (data) => {
    return await CommunityComment.create(data);
};

const findAll = async (where = {}) => {
    return await CommunityComment.findAll({
        where,
        order: [["created_at", "ASC"]]
    });
};

const findById = async (id) => {
    return await CommunityComment.findByPk(id);
};

const update = async (comment, data) => {
    return await comment.update(data);
};

const deleteComment = async (comment) => {
    return await comment.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    deleteComment
};

