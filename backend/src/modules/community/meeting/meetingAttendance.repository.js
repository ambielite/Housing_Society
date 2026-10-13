const CommunityMeetingAttendance =
    require("./meetingAttendance.model");

const create = async (data) => {
    return await CommunityMeetingAttendance.create(data);
};

const findAll = async (where = {}) => {
    return await CommunityMeetingAttendance.findAll({
        where,
        order: [
            ["createdAt", "ASC"]
        ]
    });
};

const findById = async (id) => {
    return await CommunityMeetingAttendance.findByPk(id);
};

const findOne = async (where) => {
    return await CommunityMeetingAttendance.findOne({
        where
    });
};

const update = async (attendance, data) => {
    return await attendance.update(data);
};

const deleteAttendance = async (attendance) => {
    return await attendance.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    findOne,
    update,
    deleteAttendance
};