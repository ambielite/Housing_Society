const SocietySettings = require("./society-settings.model");


// Create Settings
const create = async (settingsData) => {
    return await SocietySettings.create(settingsData);
};


// Find Settings by Society
const findBySocietyId = async (societyId) => {
    return await SocietySettings.findOne({
        where: {
            societyId
        }
    });
};


// Find Settings by ID
const findById = async (id) => {
    return await SocietySettings.findByPk(id);
};


// Update Settings
const update = async (id, settingsData) => {

    const settings =
        await SocietySettings.findByPk(id);

    if (!settings) {
        return null;
    }

    await settings.update(settingsData);

    return settings;
};


// Delete Settings
const remove = async (id) => {

    const settings =
        await SocietySettings.findByPk(id);

    if (!settings) {
        return null;
    }

    await settings.destroy();

    return settings;
};


module.exports = {
    create,
    findBySocietyId,
    findById,
    update,
    remove
};