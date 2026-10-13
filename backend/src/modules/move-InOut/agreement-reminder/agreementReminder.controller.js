const service =
    require("./agreementReminder.service");


// ==========================================
// CONFIGURATION
// ==========================================

const createConfig = async (req, res) => {

    try {

        const config =
            await service.createConfig(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Agreement reminder configuration created successfully",
            data: config
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getConfigsBySociety = async (
    req,
    res
) => {

    try {

        const configs =
            await service.getConfigsBySociety(
                req.params.societyId
            );

        res.status(200).json({
            success: true,
            data: configs
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getConfig = async (req, res) => {

    try {

        const config =
            await service.getConfig(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: config
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const updateConfig = async (
    req,
    res
) => {

    try {

        const config =
            await service.updateConfig(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Reminder configuration updated successfully",
            data: config
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteConfig = async (
    req,
    res
) => {

    try {

        await service.deleteConfig(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message:
                "Reminder configuration deleted successfully"
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


// ==========================================
// REMINDERS
// ==========================================

const generateRemindersForAgreement =
    async (req, res) => {

        try {

            const reminders =
                await service.generateRemindersForAgreement(
                    req.params.agreementId
                );

            res.status(201).json({
                success: true,
                message:
                    "Agreement reminders generated successfully",
                data: reminders
            });

        } catch (error) {

            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };


const generateAllReminders =
    async (req, res) => {

        try {

            const results =
                await service.generateAllReminders();

            res.status(201).json({
                success: true,
                message:
                    "Agreement reminders generated successfully",
                data: results
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };


const getReminders = async (
    req,
    res
) => {

    try {

        const reminders =
            await service.getReminders();

        res.status(200).json({
            success: true,
            data: reminders
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getReminder = async (
    req,
    res
) => {

    try {

        const reminder =
            await service.getReminder(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: reminder
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const getRemindersByAgreement =
    async (req, res) => {

        try {

            const reminders =
                await service.getRemindersByAgreement(
                    req.params.agreementId
                );

            res.status(200).json({
                success: true,
                data: reminders
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };


const getPendingReminders =
    async (req, res) => {

        try {

            const reminders =
                await service.getPendingReminders();

            res.status(200).json({
                success: true,
                data: reminders
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };


const processReminder = async (
    req,
    res
) => {

    try {

        const reminder =
            await service.processReminder(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Agreement reminder processed successfully",
            data: reminder
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteReminder = async (
    req,
    res
) => {

    try {

        await service.deleteReminder(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message:
                "Agreement reminder deleted successfully"
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {

    createConfig,

    getConfigsBySociety,

    getConfig,

    updateConfig,

    deleteConfig,

    generateRemindersForAgreement,

    generateAllReminders,

    getReminders,

    getReminder,

    getRemindersByAgreement,

    getPendingReminders,

    processReminder,

    deleteReminder
};