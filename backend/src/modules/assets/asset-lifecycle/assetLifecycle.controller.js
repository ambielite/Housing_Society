
const service =
    require("./assetLifecycle.service");


const createLifecycle = async (
    req,
    res
) => {

    try {

        const lifecycle =
            await service.createLifecycle(
                req.body
            );

        res.status(201).json({

            success: true,

            message:
                "Asset lifecycle record created successfully",

            data:
                lifecycle
        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


const getAllLifecycles = async (
    req,
    res
) => {

    try {

        const lifecycles =
            await service.getAllLifecycles(
                req.query
            );

        res.status(200).json({

            success: true,

            count:
                lifecycles.length,

            data:
                lifecycles
        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


const getLifecycleById = async (
    req,
    res
) => {

    try {

        const lifecycle =
            await service.getLifecycleById(
                req.params.id
            );

        res.status(200).json({

            success: true,

            data:
                lifecycle
        });

    } catch (error) {

        res.status(404).json({

            success: false,

            message:
                error.message
        });
    }
};


const getLifecyclesByAssetId = async (
    req,
    res
) => {

    try {

        const lifecycles =
            await service.getLifecyclesByAssetId(
                req.params.assetId
            );

        res.status(200).json({

            success: true,

            count:
                lifecycles.length,

            data:
                lifecycles
        });

    } catch (error) {

        res.status(404).json({

            success: false,

            message:
                error.message
        });
    }
};


const acknowledgeLifecycle = async (
    req,
    res
) => {

    try {

        const lifecycle =
            await service.acknowledgeLifecycle(
                req.params.id
            );

        res.status(200).json({

            success: true,

            message:
                "Reminder acknowledged successfully",

            data:
                lifecycle
        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


const completeLifecycle = async (
    req,
    res
) => {

    try {

        const lifecycle =
            await service.completeLifecycle(
                req.params.id
            );

        res.status(200).json({

            success: true,

            message:
                "Lifecycle record completed successfully",

            data:
                lifecycle
        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


const cancelLifecycle = async (
    req,
    res
) => {

    try {

        const lifecycle =
            await service.cancelLifecycle(
                req.params.id
            );

        res.status(200).json({

            success: true,

            message:
                "Lifecycle record cancelled successfully",

            data:
                lifecycle
        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


const sendReminder = async (
    req,
    res
) => {

    try {

        const lifecycle =
            await service.sendReminder(
                req.params.id
            );

        res.status(200).json({

            success: true,

            message:
                "Reminder sent successfully",

            data:
                lifecycle
        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


const createWarrantyReminder = async (
    req,
    res
) => {

    try {

        const lifecycle =
            await service.createWarrantyReminder(
                req.body
            );

        res.status(201).json({

            success: true,

            message:
                "Warranty reminder created successfully",

            data:
                lifecycle
        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


const createAMCReminder = async (
    req,
    res
) => {

    try {

        const lifecycle =
            await service.createAMCReminder(
                req.body
            );

        res.status(201).json({

            success: true,

            message:
                "AMC reminder created successfully",

            data:
                lifecycle
        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


const createMaintenanceReminder = async (
    req,
    res
) => {

    try {

        const lifecycle =
            await service.createMaintenanceReminder(
                req.body
            );

        res.status(201).json({

            success: true,

            message:
                "Maintenance reminder created successfully",

            data:
                lifecycle
        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


const createLowStockReminder = async (
    req,
    res
) => {

    try {

        const lifecycle =
            await service.createLowStockReminder(
                req.body
            );

        res.status(201).json({

            success: true,

            message:
                "Low stock reminder created successfully",

            data:
                lifecycle
        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


const retireAsset = async (
    req,
    res
) => {

    try {

        const lifecycle =
            await service.retireAsset(
                req.params.assetId,
                req.body
            );

        res.status(200).json({

            success: true,

            message:
                "Asset retired successfully",

            data:
                lifecycle
        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


const disposeAsset = async (
    req,
    res
) => {

    try {

        const lifecycle =
            await service.disposeAsset(
                req.params.assetId,
                req.body
            );

        res.status(200).json({

            success: true,

            message:
                "Asset disposed successfully",

            data:
                lifecycle
        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


const processDueReminders = async (
    req,
    res
) => {

    try {

        const result =
            await service.processDueReminders(
                req.query.societyId || req.body?.societyId
            );


        res.status(200).json({

            success: true,

            message:
                "Due reminders processed successfully",

            data:
                result
        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message:
                error.message
        });
    }
};


const markExpiredReminders = async (
    req,
    res
) => {

    try {

        const result =
            await service.markExpiredReminders(
                req.query.societyId || req.body?.societyId
            );


        res.status(200).json({

            success: true,

            message:
                "Expired reminders updated successfully",

            data:
                result
        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message:
                error.message
        });
    }
};


const deleteLifecycle = async (
    req,
    res
) => {

    try {

        await service.deleteLifecycle(
            req.params.id
        );

        res.status(200).json({

            success: true,

            message:
                "Lifecycle record deleted successfully"
        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


module.exports = {

    createLifecycle,

    getAllLifecycles,

    getLifecycleById,

    getLifecyclesByAssetId,

    acknowledgeLifecycle,

    completeLifecycle,

    cancelLifecycle,

    sendReminder,

    createWarrantyReminder,

    createAMCReminder,

    createMaintenanceReminder,

    createLowStockReminder,

    retireAsset,

    disposeAsset,

    processDueReminders,

    markExpiredReminders,

    deleteLifecycle
};

