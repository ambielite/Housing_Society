
const Notification =
    require("./notification.model");


// Create notification
const create = async (data) => {

    return await Notification.create(data);
};


// Find all notifications
const findAll = async (where = {}) => {

    return await Notification.findAll({
        where,
        order: [["created_at", "DESC"]]
    });
};


// Find notification by ID
const findById = async (id) => {

    return await Notification.findByPk(id);
};


// Find user notifications
const findByUser = async (
    societyId,
    userId,
    where = {}
) => {

    return await Notification.findAll({
        where: {
            societyId,
            userId,
            ...where
        },
        order: [["created_at", "DESC"]]
    });
};


// Find unread notifications
const findUnreadByUser = async (
    societyId,
    userId
) => {

    return await Notification.findAll({
        where: {
            societyId,
            userId,
            isRead: false
        },
        order: [["created_at", "DESC"]]
    });
};


// Update notification
const update = async (
    notification,
    data
) => {

    return await notification.update(data);
};


// Delete notification
const remove = async (
    notification
) => {

    return await notification.destroy();
};


module.exports = {
    create,
    findAll,
    findById,
    findByUser,
    findUnreadByUser,
    update,
    remove
};


