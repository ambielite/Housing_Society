const ResidentVerification = require("./residentVerification.model");

const create = async (data) => {
    return await ResidentVerification.create(data);
};

const findById = async (id) => {
    return await ResidentVerification.findByPk(id);
};

const findAll = async (where = {}) => {
    return await ResidentVerification.findAll({
        where,
        order: [["created_at", "DESC"]]
    });
};

const findPending = async (societyId) => {
    const where = {
        status: "PENDING"
    };

    if (societyId) {
        where.societyId = societyId;
    }

    return await ResidentVerification.findAll({
        where,
        order: [["submitted_at", "ASC"]]
    });
};

const findByResident = async (residentId) => {
    return await ResidentVerification.findAll({
        where: {
            residentId
        },
        order: [["created_at", "DESC"]]
    });
};

const update = async (id, data) => {
    const verification = await ResidentVerification.findByPk(id);

    if (!verification) {
        return null;
    }

    await verification.update(data);

    return verification;
};

const remove = async (id) => {
    const verification = await ResidentVerification.findByPk(id);

    if (!verification) {
        return null;
    }

    await verification.destroy();

    return verification;
};

module.exports = {
    create,
    findById,
    findAll,
    findPending,
    findByResident,
    update,
    remove
};