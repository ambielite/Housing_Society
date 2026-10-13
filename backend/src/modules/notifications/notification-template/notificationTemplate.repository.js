
const NotificationTemplate =
    require("./notificationTemplate.model");

const create = async (data) => {
    return await NotificationTemplate.create(data);
};

const findAll = async (where = {}) => {

    return await NotificationTemplate.findAll({
        where,
        order: [
            ["created_at", "DESC"]
        ]
    });
};

const findById = async (id) => {

    return await NotificationTemplate.findByPk(id);
};

const findByCodeAndChannel = async (
    templateCode,
    channel,
    societyId
) => {

    return await NotificationTemplate.findOne({
        where: {
            templateCode,
            channel,
            societyId
        }
    });
};

const update = async (
    template,
    data
) => {

    return await template.update(data);
};

const deleteTemplate = async (
    template
) => {

    return await template.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    findByCodeAndChannel,
    update,
    deleteTemplate
};

