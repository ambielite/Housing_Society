const AgreementReminderConfig =
    require("./agreementReminderConfig.model");

const AgreementReminder =
    require("./agreementReminder.model");

const { Op } = require("sequelize");


// ================================
// CONFIGURATION
// ================================

const createConfig = async (data) => {

    return await AgreementReminderConfig.create(
        data
    );
};


const findAllConfigsBySociety = async (
    societyId
) => {

    return await AgreementReminderConfig.findAll({
        where: {
            societyId
        },
        order: [
            ["daysBeforeExpiry", "DESC"]
        ]
    });
};


const findConfigById = async (id) => {

    return await AgreementReminderConfig.findByPk(
        id
    );
};


const findConfig = async (
    societyId,
    reminderType
) => {

    return await AgreementReminderConfig.findOne({
        where: {
            societyId,
            reminderType
        }
    });
};


const updateConfig = async (
    id,
    data
) => {

    const config =
        await AgreementReminderConfig.findByPk(id);

    if (!config) {
        return null;
    }

    await config.update(data);

    return config;
};


const deleteConfig = async (id) => {

    const config =
        await AgreementReminderConfig.findByPk(id);

    if (!config) {
        return null;
    }

    await config.destroy();

    return config;
};


// ================================
// REMINDERS
// ================================

const createReminder = async (data) => {

    return await AgreementReminder.create(
        data
    );
};


const findReminderById = async (id) => {

    return await AgreementReminder.findByPk(id);
};


const findAllReminders = async () => {

    return await AgreementReminder.findAll({
        order: [
            ["reminderDate", "ASC"]
        ]
    });
};


const findByAgreement = async (
    agreementId
) => {

    return await AgreementReminder.findAll({
        where: {
            agreementId
        },
        order: [
            ["reminderDate", "ASC"]
        ]
    });
};


const findPendingReminders = async () => {

    return await AgreementReminder.findAll({
        where: {
            status: "PENDING"
        },
        order: [
            ["reminderDate", "ASC"]
        ]
    });
};


const findReminder = async (
    agreementId,
    reminderType
) => {

    return await AgreementReminder.findOne({
        where: {
            agreementId,
            reminderType
        }
    });
};


const updateReminder = async (
    id,
    data
) => {

    const reminder =
        await AgreementReminder.findByPk(id);

    if (!reminder) {
        return null;
    }

    await reminder.update(data);

    return reminder;
};


const deleteReminder = async (id) => {

    const reminder =
        await AgreementReminder.findByPk(id);

    if (!reminder) {
        return null;
    }

    await reminder.destroy();

    return reminder;
};


module.exports = {

    createConfig,
    findAllConfigsBySociety,
    findConfigById,
    findConfig,
    updateConfig,
    deleteConfig,

    createReminder,
    findReminderById,
    findAllReminders,
    findByAgreement,
    findPendingReminders,
    findReminder,
    updateReminder,
    deleteReminder
};