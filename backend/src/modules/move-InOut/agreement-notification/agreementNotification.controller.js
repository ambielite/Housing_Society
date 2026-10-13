const service =
    require("./agreementNotification.service");


const create = async (req, res) => {

    try {

        const result =
            await service.createNotification(
                req.body
            );

        res.status(201).json({
            success: true,
            message: "Notification created successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAll = async (req, res) => {

    try {

        const result =
            await service.getAllNotifications();

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getPending = async (req, res) => {

    try {

        const result =
            await service.getPending();

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getById = async (req, res) => {

    try {

        const result =
            await service.getNotificationById(
                req.params.id
            );

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const getByAgreement = async (req, res) => {

    try {

        const result =
            await service.getByAgreement(
                req.params.agreementId
            );

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getByReminder = async (req, res) => {

    try {

        const result =
            await service.getByReminder(
                req.params.reminderId
            );

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const process = async (req, res) => {

    try {

        const result =
            await service.processNotification(
                req.params.id
            );

        res.json({
            success: true,
            message: "Notification processed successfully",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const markRead = async (req, res) => {

    try {

        const result =
            await service.markAsRead(
                req.params.id
            );

        res.json({
            success: true,
            message: "Notification marked as read",
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const runScheduler = async (req, res) => {

    try {

        const scheduler =
            require("./agreementNotification.scheduler");

        await scheduler
            .runAgreementNotificationScheduler();

        res.json({
            success: true,
            message:
                "Agreement notification scheduler executed successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const deleteNotification = async (req, res) => {

    try {

        await service.deleteNotification(
            req.params.id
        );

        res.json({
            success: true,
            message: "Notification deleted successfully"
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {

    create,

    getAll,

    getPending,

    getById,

    getByAgreement,

    getByReminder,

    process,

    markRead,

    runScheduler,

    deleteNotification
};