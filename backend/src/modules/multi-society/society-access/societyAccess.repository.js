const SocietyAccess = require("./societyAccess.model");

const create = async (data) => {
    return await SocietyAccess.create(data);
};

const findById = async (id) => {
    return await SocietyAccess.findByPk(id);
};

const findUserAccess = async (userId, societyId) => {
    return await SocietyAccess.findOne({
        where: {
            userId,
            societyId,
            isActive: true
        }
    });
};

const findUserSocieties = async (userId) => {
    return await SocietyAccess.findAll({
        where: {
            userId,
            isActive: true
        },
        order: [
            ["isDefault", "DESC"],
            ["created_at", "ASC"]
        ]
    });
};

const findDefaultSociety = async (userId) => {
    return await SocietyAccess.findOne({
        where: {
            userId,
            isDefault: true,
            isActive: true
        }
    });
};

const update = async (record, data) => {
    await record.update(data);
    return record;
};

const remove = async (record) => {
    await record.destroy();
};

module.exports = {
    create,
    findById,
    findUserAccess,
    findUserSocieties,
    findDefaultSociety,
    update,
    remove
};