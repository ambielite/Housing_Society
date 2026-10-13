const CommunityEventRsvp =
    require("./eventRsvp.model");

const create = async (data) => {
    return await CommunityEventRsvp.create(data);
};

const findAll = async (where = {}) => {
    return await CommunityEventRsvp.findAll({
        where,
        order: [
            ["registeredAt", "ASC"]
        ]
    });
};

const findById = async (id) => {
    return await CommunityEventRsvp.findByPk(id);
};

const findOne = async (where) => {
    return await CommunityEventRsvp.findOne({
        where
    });
};

const count = async (where = {}) => {
    return await CommunityEventRsvp.count({
        where
    });
};

const update = async (rsvp, data) => {
    return await rsvp.update(data);
};

const deleteRsvp = async (rsvp) => {
    return await rsvp.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    findOne,
    count,
    update,
    deleteRsvp
};