const NonMember = require("./nonMember.model");

const create = async (data) => {
    return await NonMember.create(data);
};

const findById = async (id) => {
    return await NonMember.findByPk(id);
};

const findAll = async (where = {}) => {
    return await NonMember.findAll({
        where,
        order: [["created_at", "DESC"]]
    });
};

const findBySociety = async (societyId) => {
    return await NonMember.findAll({
        where: {
            societyId
        },
        order: [["created_at", "DESC"]]
    });
};

const findByMobile = async (mobile, societyId) => {
    return await NonMember.findOne({
        where: {
            mobile,
            societyId
        }
    });
};

const update = async (id, data) => {
    const nonMember = await NonMember.findByPk(id);

    if (!nonMember) {
        return null;
    }

    await nonMember.update(data);

    return nonMember;
};

const remove = async (id) => {
    const nonMember = await NonMember.findByPk(id);

    if (!nonMember) {
        return null;
    }

    await nonMember.destroy();

    return nonMember;
};

module.exports = {
    create,
    findById,
    findAll,
    findBySociety,
    findByMobile,
    update,
    remove
};
