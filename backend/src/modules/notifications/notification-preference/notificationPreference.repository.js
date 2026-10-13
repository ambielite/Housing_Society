
const NotificationPreference =
    require("./notificationPreference.model");

const create = async (data) => {

    return await NotificationPreference.create(
        data
    );
};

const findAll = async (where = {}) => {

    return await NotificationPreference.findAll({
        where,
        order: [
            ["created_at", "DESC"]
        ]
    });
};

const findById = async (id) => {

    return await NotificationPreference.findByPk(
        id
    );
};

const findByUser = async (
    societyId,
    userId
) => {

    return await NotificationPreference.findAll({
        where: {
            societyId,
            userId
        },
        order: [
            ["channel", "ASC"]
        ]
    });
};

const findByUserAndChannel = async (
    societyId,
    userId,
    channel
) => {

    return await NotificationPreference.findOne({
        where: {
            societyId,
            userId,
            channel
        }
    });
};

const update = async (
    preference,
    data
) => {

    return await preference.update(data);
};

const deletePreference = async (
    preference
) => {

    return await preference.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    findByUser,
    findByUserAndChannel,
    update,
    deletePreference
};
