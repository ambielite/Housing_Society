const MultiSocietyAccess =
    require("./multiSociety.model");


const create = async (data) => {
    return await MultiSocietyAccess.create(data);
};


const findById = async (id) => {
    return await MultiSocietyAccess.findByPk(id);
};


const findByUser = async (userId) => {
    return await MultiSocietyAccess.findAll({
        where: {
            userId
        },
        order: [
            ["created_at", "DESC"]
        ]
    });
};


const findActiveByUser = async (userId) => {
    return await MultiSocietyAccess.findAll({
        where: {
            userId,
            status: "ACTIVE"
        },
        order: [
            ["created_at", "DESC"]
        ]
    });
};


const findByUserAndSociety = async (
    userId,
    societyId
) => {

    return await MultiSocietyAccess.findOne({
        where: {
            userId,
            societyId,
            status: "ACTIVE"
        }
    });
};


const update = async (access, data) => {
    return await access.update(data);
};


const remove = async (access) => {
    return await access.destroy();
};


module.exports = {
    create,
    findById,
    findByUser,
    findActiveByUser,
    findByUserAndSociety,
    update,
    remove
};