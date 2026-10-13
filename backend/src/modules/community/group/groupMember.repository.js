
const CommunityGroupMember = require("./groupMember.model");

const create = async (data) => {
    return await CommunityGroupMember.create(data);
};

const findAll = async (where = {}) => {
    return await CommunityGroupMember.findAll({
        where,
        order: [["created_at", "DESC"]]
    });
};

const findById = async (id) => {
    return await CommunityGroupMember.findByPk(id);
};

const findOne = async (where) => {
    return await CommunityGroupMember.findOne({
        where
    });
};

const update = async (member, data) => {
    return await member.update(data);
};

const deleteMember = async (member) => {
    return await member.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    findOne,
    update,
    deleteMember
};
