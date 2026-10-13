const CommunityMeetingActionItem =
    require("./meetingActionItem.model");

const create = async (data) => {
    return await CommunityMeetingActionItem.create(data);
};

const findAll = async (where = {}) => {
    return await CommunityMeetingActionItem.findAll({
        where,
        order: [
            ["dueDate", "ASC"]
        ]
    });
};

const findById = async (id) => {
    return await CommunityMeetingActionItem.findByPk(id);
};

const update = async (item, data) => {
    return await item.update(data);
};

const deleteActionItem = async (item) => {
    return await item.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    deleteActionItem
};