const AgreementNotification = require("./agreementNotification.model");

const create = async (data) => {
    return await AgreementNotification.create(data);
};

const findAll = async () => {
    return await AgreementNotification.findAll({
        order: [["created_at", "DESC"]]
    });
};

const findById = async (id) => {
    return await AgreementNotification.findByPk(id);
};

const findByAgreement = async (agreementId) => {
    return await AgreementNotification.findAll({
        where: {
            agreementId
        },
        order: [["created_at", "DESC"]]
    });
};

const findByReminder = async (reminderId) => {
    return await AgreementNotification.findAll({
        where: {
            reminderId
        },
        order: [["created_at", "DESC"]]
    });
};

const findPending = async () => {
    return await AgreementNotification.findAll({
        where: {
            deliveryStatus: "PENDING"
        },
        order: [["created_at", "ASC"]]
    });
};

const update = async (id, data) => {
    const notification = await AgreementNotification.findByPk(id);

    if (!notification) {
        return null;
    }

    await notification.update(data);

    return notification;
};

const deleteById = async (id) => {
    const notification = await AgreementNotification.findByPk(id);

    if (!notification) {
        return null;
    }

    await notification.destroy();

    return notification;
};

module.exports = {
    create,
    findAll,
    findById,
    findByAgreement,
    findByReminder,
    findPending,
    update,
    deleteById
};