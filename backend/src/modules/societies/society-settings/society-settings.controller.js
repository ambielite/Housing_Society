    const settingsService =
        require("./society-settings.service");


    // Create Settings
    const createSettings = async (
        req,
        res,
        next
    ) => {

        try {

            const settings =
                await settingsService.createSettings(
                    req.body
                );


            res.status(201).json({
                success: true,
                message:
                    "Society settings created successfully",
                data: settings
            });

        } catch (error) {

            next(error);

        }
    };


    // Get Settings by Society
    const getSettingsBySociety = async (
        req,
        res,
        next
    ) => {

        try {

            const settings =
                await settingsService.getSettingsBySociety(
                    req.params.societyId
                );


            res.status(200).json({
                success: true,
                data: settings
            });

        } catch (error) {

            next(error);

        }
    };


    // Get Settings by ID
    const getSettingsById = async (
        req,
        res,
        next
    ) => {

        try {

            const settings =
                await settingsService.getSettingsById(
                    req.params.id
                );


            res.status(200).json({
                success: true,
                data: settings
            });

        } catch (error) {

            next(error);

        }
    };


    // Update Settings
    const updateSettings = async (
        req,
        res,
        next
    ) => {

        try {

            const settings =
                await settingsService.updateSettings(
                    req.params.id,
                    req.body
                );


            res.status(200).json({
                success: true,
                message:
                    "Society settings updated successfully",
                data: settings
            });

        } catch (error) {

            next(error);

        }
    };


    module.exports = {
        createSettings,
        getSettingsBySociety,
        getSettingsById,
        updateSettings
    };