const settingsRepository =
    require("./society-settings.repository");


// Create Society Settings
const createSettings = async (
    settingsData
) => {

    const existingSettings =
        await settingsRepository.findBySocietyId(
            settingsData.societyId
        );


    if (existingSettings) {

        const error = new Error(
            "Settings already exist for this society"
        );

        error.statusCode = 409;

        throw error;
    }


    return await settingsRepository.create({
        societyId:
            settingsData.societyId,

        billingCycle:
            settingsData.billingCycle ||
            "MONTHLY",

        dueDate:
            settingsData.dueDate ||
            10,

        penaltyRules:
            settingsData.penaltyRules ||
            {},

        approvalHierarchy:
            settingsData.approvalHierarchy ||
            [],

        visitorCategories:
            settingsData.visitorCategories ||
            [],

        amenityRules:
            settingsData.amenityRules ||
            {}
    });
};


// Get Settings by Society
const getSettingsBySociety = async (
    societyId
) => {

    const settings =
        await settingsRepository.findBySocietyId(
            societyId
        );


    if (!settings) {

        const error = new Error(
            "Society settings not found"
        );

        error.statusCode = 404;

        throw error;
    }


    return settings;
};


// Get Settings by ID
const getSettingsById = async (
    id
) => {

    const settings =
        await settingsRepository.findById(id);


    if (!settings) {

        const error = new Error(
            "Society settings not found"
        );

        error.statusCode = 404;

        throw error;
    }


    return settings;
};


// Update Settings
const updateSettings = async (
    id,
    settingsData
) => {

    const existingSettings =
        await settingsRepository.findById(id);


    if (!existingSettings) {

        const error = new Error(
            "Society settings not found"
        );

        error.statusCode = 404;

        throw error;
    }


    return await settingsRepository.update(
        id,
        settingsData
    );
};


module.exports = {
    createSettings,
    getSettingsBySociety,
    getSettingsById,
    updateSettings
};