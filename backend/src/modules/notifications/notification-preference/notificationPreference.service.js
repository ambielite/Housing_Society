
const repository =
    require("./notificationPreference.repository");

const Society =
    require("../../../modules/societies/society/society.model");

const {
    validateCreatePreference,
    validateUpdatePreference
} = require("../notification-template/notification.validation");

const { validate: validateUUID } =
    require("uuid");

const createPreference = async (data) => {

    const errors =
        validateCreatePreference(data);

    if (errors.length > 0) {
        throw new Error(
            errors.join(", ")
        );
    }

    // Check society
    const society =
        await Society.findByPk(
            data.societyId
        );

    if (!society) {
        throw new Error(
            "Society not found"
        );
    }

    // Check duplicate preference
    const existing =
        await repository.findByUserAndChannel(
            data.societyId,
            data.userId,
            data.channel
        );

    if (existing) {
        throw new Error(
            "Notification preference for this channel already exists"
        );
    }

    return await repository.create(data);
};

const getAllPreferences = async (
    filters = {}
) => {

    const where = {};

    if (filters.societyId) {
        where.societyId =
            filters.societyId;
    }

    if (filters.userId) {
        where.userId =
            filters.userId;
    }

    if (filters.channel) {
        where.channel =
            filters.channel;
    }

    if (
        filters.enabled !== undefined
    ) {
        where.enabled =
            filters.enabled === "true";
    }

    return await repository.findAll(
        where
    );
};

const getPreferenceById = async (id) => {

    if (!validateUUID(id)) {
        throw new Error(
            "Invalid preference ID"
        );
    }

    const preference =
        await repository.findById(id);

    if (!preference) {
        throw new Error(
            "Notification preference not found"
        );
    }

    return preference;
};

const getUserPreferences = async (
    societyId,
    userId
) => {

    if (!validateUUID(societyId)) {
        throw new Error(
            "Invalid societyId"
        );
    }

    if (!validateUUID(userId)) {
        throw new Error(
            "Invalid userId"
        );
    }

    const society =
        await Society.findByPk(
            societyId
        );

    if (!society) {
        throw new Error(
            "Society not found"
        );
    }

    return await repository.findByUser(
        societyId,
        userId
    );
};

const updatePreference = async (
    id,
    data
) => {

    if (!validateUUID(id)) {
        throw new Error(
            "Invalid preference ID"
        );
    }

    const errors =
        validateUpdatePreference(data);

    if (errors.length > 0) {
        throw new Error(
            errors.join(", ")
        );
    }

    const preference =
        await repository.findById(id);

    if (!preference) {
        throw new Error(
            "Notification preference not found"
        );
    }

    return await repository.update(
        preference,
        data
    );
};

const enablePreference = async (id) => {

    const preference =
        await getPreferenceById(id);

    return await repository.update(
        preference,
        {
            enabled: true
        }
    );
};

const disablePreference = async (id) => {

    const preference =
        await getPreferenceById(id);

    return await repository.update(
        preference,
        {
            enabled: false
        }
    );
};

const deletePreference = async (id) => {

    const preference =
        await getPreferenceById(id);

    return await repository.deletePreference(
        preference
    );
};

module.exports = {
    createPreference,
    getAllPreferences,
    getPreferenceById,
    getUserPreferences,
    updatePreference,
    enablePreference,
    disablePreference,
    deletePreference
};

