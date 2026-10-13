const CommunityMeeting =
    require("./meeting.model");

const create = async (data) => {
    return await CommunityMeeting.create(data);
};

const findAll = async (where = {}) => {
    return await CommunityMeeting.findAll({
        where,
        order: [
            ["scheduledAt", "ASC"]
        ]
    });
};

const findById = async (id) => {
    return await CommunityMeeting.findByPk(id);
};

const update = async (meeting, data) => {
    return await meeting.update(data);
};

const deleteMeeting = async (meeting) => {
    return await meeting.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    deleteMeeting
};