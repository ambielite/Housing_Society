const CommunityEvent = require("./event.model");

const create = async (data) => {
    return await CommunityEvent.create(data);
};

const findAll = async (where = {}) => {
    return await CommunityEvent.findAll({
        where,
        order: [
            ["startAt", "ASC"]
        ]
    });
};

const findById = async (id) => {
    return await CommunityEvent.findByPk(id);
};

const update = async (event, data) => {
    return await event.update(data);
};

const deleteEvent = async (event) => {
    return await event.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    deleteEvent
};