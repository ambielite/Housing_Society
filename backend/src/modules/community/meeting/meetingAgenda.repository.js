const CommunityMeetingAgenda =
    require("./meetingAgenda.model");

const create = async (data) => {
    return await CommunityMeetingAgenda.create(data);
};

const findAll = async (where = {}) => {
    return await CommunityMeetingAgenda.findAll({
        where,
        order: [
            ["agendaOrder", "ASC"]
        ]
    });
};

const findById = async (id) => {
    return await CommunityMeetingAgenda.findByPk(id);
};

const update = async (agenda, data) => {
    return await agenda.update(data);
};

const deleteAgenda = async (agenda) => {
    return await agenda.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    deleteAgenda
};