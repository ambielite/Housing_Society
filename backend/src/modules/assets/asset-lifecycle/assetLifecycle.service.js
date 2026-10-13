
const {
    Op
} = require("sequelize");

const Asset =
    require("../asset/asset.model");

const Society =
    require("../../../modules/societies/society/society.model");

const repository =
    require("./assetLifecycle.repository");

const {
    validateCreateLifecycle
} = require("./assetLifecycle.validation");


const createLifecycle = async (
    data
) => {

    const errors =
        validateCreateLifecycle(data);


    if (errors.length > 0) {

        throw new Error(
            errors.join(", ")
        );
    }


    const society =
        await Society.findByPk(
            data.societyId
        );


    if (!society) {

        throw new Error(
            "Society not found"
        );
    }


    const asset =
        await Asset.findByPk(
            data.assetId
        );


    if (!asset) {

        throw new Error(
            "Asset not found"
        );
    }


    if (
        asset.societyId !==
        data.societyId
    ) {

        throw new Error(
            "Asset does not belong to this society"
        );
    }


    if (
        data.dueDate &&
        data.reminderDate
    ) {

        if (
            new Date(
                data.reminderDate
            ) >
            new Date(
                data.dueDate
            )
        ) {

            throw new Error(
                "reminderDate cannot be after dueDate"
            );
        }
    }


    return await repository.create(
        data
    );
};


const getAllLifecycles = async (
    filters = {}
) => {

    const where = {};


    if (filters.societyId) {

        where.societyId =
            filters.societyId;
    }


    if (filters.assetId) {

        where.assetId =
            filters.assetId;
    }


    if (filters.lifecycleType) {

        where.lifecycleType =
            filters.lifecycleType;
    }


    if (filters.status) {

        where.status =
            filters.status;
    }


    if (filters.priority) {

        where.priority =
            filters.priority;
    }


    return await repository.findAll(
        where
    );
};


const getLifecycleById = async (
    id
) => {

    const lifecycle =
        await repository.findById(id);


    if (!lifecycle) {

        throw new Error(
            "Asset lifecycle record not found"
        );
    }


    return lifecycle;
};


const getLifecyclesByAssetId = async (
    assetId
) => {

    const asset =
        await Asset.findByPk(
            assetId
        );


    if (!asset) {

        throw new Error(
            "Asset not found"
        );
    }


    return await repository.findByAssetId(
        assetId
    );
};


const acknowledgeLifecycle = async (
    id
) => {

    const lifecycle =
        await repository.findById(id);


    if (!lifecycle) {

        throw new Error(
            "Asset lifecycle record not found"
        );
    }


    if (
        lifecycle.status !==
        "SENT"
    ) {

        throw new Error(
            "Only sent reminders can be acknowledged"
        );
    }


    return await repository.update(
        lifecycle,
        {
            status: "ACKNOWLEDGED",

            acknowledgedAt:
                new Date()
        }
    );
};


const completeLifecycle = async (
    id
) => {

    const lifecycle =
        await repository.findById(id);


    if (!lifecycle) {

        throw new Error(
            "Asset lifecycle record not found"
        );
    }


    if (
        [
            "CANCELLED",
            "COMPLETED"
        ].includes(
            lifecycle.status
        )
    ) {

        throw new Error(
            "Lifecycle record cannot be completed"
        );
    }


    return await repository.update(
        lifecycle,
        {
            status: "COMPLETED",

            completedAt:
                new Date()
        }
    );
};


const cancelLifecycle = async (
    id
) => {

    const lifecycle =
        await repository.findById(id);


    if (!lifecycle) {

        throw new Error(
            "Asset lifecycle record not found"
        );
    }


    if (
        lifecycle.status ===
        "COMPLETED"
    ) {

        throw new Error(
            "Completed lifecycle record cannot be cancelled"
        );
    }


    return await repository.update(
        lifecycle,
        {
            status: "CANCELLED"
        }
    );
};


const sendReminder = async (
    id
) => {

    const lifecycle =
        await repository.findById(id);


    if (!lifecycle) {

        throw new Error(
            "Asset lifecycle record not found"
        );
    }


    if (
        [
            "COMPLETED",
            "CANCELLED"
        ].includes(
            lifecycle.status
        )
    ) {

        throw new Error(
            "Reminder cannot be sent"
        );
    }


    return await repository.update(
        lifecycle,
        {
            status: "SENT",

            notificationSentAt:
                new Date()
        }
    );
};


const createWarrantyReminder = async (
    data
) => {

    return await createLifecycle({

        ...data,

        lifecycleType:
            "WARRANTY_EXPIRY",

        title:
            data.title ||
            "Warranty Expiry Reminder",

        priority:
            data.priority ||
            "HIGH"
    });
};


const createAMCReminder = async (
    data
) => {

    return await createLifecycle({

        ...data,

        lifecycleType:
            "AMC_EXPIRY",

        title:
            data.title ||
            "AMC Expiry Reminder",

        priority:
            data.priority ||
            "HIGH"
    });
};


const createMaintenanceReminder = async (
    data
) => {

    return await createLifecycle({

        ...data,

        lifecycleType:
            "MAINTENANCE_DUE",

        title:
            data.title ||
            "Preventive Maintenance Due",

        priority:
            data.priority ||
            "MEDIUM"
    });
};


const createLowStockReminder = async (
    data
) => {

    return await createLifecycle({

        ...data,

        lifecycleType:
            "LOW_STOCK",

        title:
            data.title ||
            "Low Stock Alert",

        priority:
            data.priority ||
            "HIGH"
    });
};


const retireAsset = async (
    assetId,
    data = {}
) => {

    const asset =
        await Asset.findByPk(
            assetId
        );


    if (!asset) {

        throw new Error(
            "Asset not found"
        );
    }


    if (
        asset.status ===
        "DISPOSED"
    ) {

        throw new Error(
            "Disposed asset cannot be retired"
        );
    }


    if (
        asset.status ===
        "RETIRED"
    ) {

        throw new Error(
            "Asset is already retired"
        );
    }


    await asset.update({

        status:
            "RETIRED",

        retirementDate:
            data.retirementDate ||
            new Date()
    });


    return await repository.create({

        societyId:
            asset.societyId,

        assetId:
            asset.id,

        lifecycleType:
            "RETIREMENT",

        title:
            "Asset Retired",

        description:
            "Asset has been retired from active use",

        retirementDate:
            data.retirementDate ||
            new Date(),

        status:
            "COMPLETED",

        priority:
            "HIGH",

        reason:
            data.reason,

        remarks:
            data.remarks,

        completedAt:
            new Date()
    });
};


const disposeAsset = async (
    assetId,
    data = {}
) => {

    const asset =
        await Asset.findByPk(
            assetId
        );


    if (!asset) {

        throw new Error(
            "Asset not found"
        );
    }


    if (
        asset.status !==
        "RETIRED"
    ) {

        throw new Error(
            "Only retired assets can be disposed"
        );
    }


    await asset.update({

        status:
            "DISPOSED"
    });


    return await repository.create({

        societyId:
            asset.societyId,

        assetId:
            asset.id,

        lifecycleType:
            "DISPOSAL",

        title:
            "Asset Disposed",

        description:
            "Asset has been disposed",

        disposalDate:
            data.disposalDate ||
            new Date(),

        disposalMethod:
            data.disposalMethod,

        disposalValue:
            data.disposalValue,

        status:
            "COMPLETED",

        priority:
            "HIGH",

        reason:
            data.reason,

        remarks:
            data.remarks,

        completedAt:
            new Date()
    });
};


const processDueReminders = async (societyId) => {

    const today =
        new Date();


    const where = {

            status:
                "PENDING",

            reminderDate: {
                [Op.lte]:
                    today
            }
        };

    if (societyId) where.societyId = societyId;

    const reminders = await repository.findPendingReminders(where);


    let processedCount = 0;


    for (
        const reminder of reminders
    ) {

        await repository.update(
            reminder,
            {
                status:
                    "SENT",

                notificationSentAt:
                    new Date()
            }
        );


        processedCount++;
    }


    return {
        processedCount
    };
};


const markExpiredReminders = async (societyId) => {

    const today =
        new Date();


    const where = {

            status: {
                [Op.in]: [
                    "PENDING",
                    "SENT"
                ]
            },

            dueDate: {
                [Op.lt]:
                    today
            }
        };

    if (societyId) where.societyId = societyId;

    const reminders = await repository.findAll(where);


    let expiredCount = 0;


    for (
        const reminder of reminders
    ) {

        await repository.update(
            reminder,
            {
                status:
                    "EXPIRED"
            }
        );


        expiredCount++;
    }


    return {
        expiredCount
    };
};


const deleteLifecycle = async (
    id
) => {

    const lifecycle =
        await repository.findById(id);


    if (!lifecycle) {

        throw new Error(
            "Asset lifecycle record not found"
        );
    }


    if (
        [
            "SENT",
            "ACKNOWLEDGED",
            "COMPLETED"
        ].includes(
            lifecycle.status
        )
    ) {

        throw new Error(
            "Processed lifecycle records cannot be deleted"
        );
    }


    return await repository.deleteLifecycle(
        lifecycle
    );
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

