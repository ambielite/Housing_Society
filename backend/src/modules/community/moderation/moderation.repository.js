
const CommunityModeration = require("./moderation.model");

const create = async (data) => {
    return await CommunityModeration.create(data);
};


const findAll = async (where = {}) => {
    return await CommunityModeration.findAll({
        where,
        order: [
            ["priority", "DESC"],
            ["createdAt", "DESC"]
        ]
    });
};


const findById = async (id) => {
    return await CommunityModeration.findByPk(id);
};


const findOne = async (where) => {
    return await CommunityModeration.findOne({
        where
    });
};


const update = async (moderation, data) => {
    return await moderation.update(data);
};


const deleteModeration = async (moderation) => {
    return await moderation.destroy();
};


module.exports = {
    create,
    findAll,
    findById,
    findOne,
    update,
    deleteModeration
};

