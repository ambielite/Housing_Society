const CommunityMeetingMinutes =
    require("./meetingMinutes.model");

const create = async (data) => {
    return await CommunityMeetingMinutes.create(data);
};

const findAll = async (where = {}) => {
    return await CommunityMeetingMinutes.findAll({
        where,
        order: [
            ["createdAt", "DESC"]
        ]
    });
};

const findById = async (id) => {
    return await CommunityMeetingMinutes.findByPk(id);
};

const findOne = async (where) => {
    return await CommunityMeetingMinutes.findOne({
        where
    });
};

const update = async (minutes, data) => {
    return await minutes.update(data);
};

const deleteMinutes = async (minutes) => {
    return await minutes.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    findOne,
    update,
    deleteMinutes
};