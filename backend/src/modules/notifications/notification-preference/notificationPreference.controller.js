
const service =
    require("./notificationPreference.service");

const createPreference = async (
    req,
    res
) => {

    try {

        const preference =
            await service.createPreference(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Notification preference created successfully",
            data: preference
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getAllPreferences = async (
    req,
    res
) => {

    try {

        const preferences =
            await service.getAllPreferences(
                req.query
            );

        res.status(200).json({
            success: true,
            message:
                "Notification preferences fetched successfully",
            data: preferences
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getPreferenceById = async (
    req,
    res
) => {

    try {

        const preference =
            await service.getPreferenceById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Notification preference fetched successfully",
            data: preference
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

const getUserPreferences = async (
    req,
    res
) => {

    try {

        const preferences =
            await service.getUserPreferences(
                req.params.societyId,
                req.params.userId
            );

        res.status(200).json({
            success: true,
            message:
                "User notification preferences fetched successfully",
            data: preferences
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const updatePreference = async (
    req,
    res
) => {

    try {

        const preference =
            await service.updatePreference(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Notification preference updated successfully",
            data: preference
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const enablePreference = async (
    req,
    res
) => {

    try {

        const preference =
            await service.enablePreference(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Notification preference enabled successfully",
            data: preference
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const disablePreference = async (
    req,
    res
) => {

    try {

        const preference =
            await service.disablePreference(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Notification preference disabled successfully",
            data: preference
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const deletePreference = async (
    req,
    res
) => {

    try {

        await service.deletePreference(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message:
                "Notification preference deleted successfully"
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
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

