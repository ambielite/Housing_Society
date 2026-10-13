
const Society =
    require("../../../modules/societies/society/society.model");

const Asset =
    require("../asset/asset.model");

const Vendor =
    require("../vendor/vendor.model");

const AMC =
    require("../amc/amc.model");

const MaintenanceSchedule =
    require("./maintenanceSchedule.model");

const repository =
    require("./maintenanceSchedule.repository");

const {
    validateCreateSchedule
} = require("./maintenanceSchedule.validation");


const createSchedule = async (data) => {

    const errors =
        validateCreateSchedule(data);

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


    if (data.vendorId) {

        const vendor =
            await Vendor.findByPk(
                data.vendorId
            );

        if (!vendor) {
            throw new Error(
                "Vendor not found"
            );
        }

        if (
            vendor.societyId !==
            data.societyId
        ) {
            throw new Error(
                "Vendor does not belong to this society"
            );
        }

        if (
            vendor.status !== "ACTIVE"
        ) {
            throw new Error(
                "Vendor must be active"
            );
        }
    }


    if (data.amcId) {

        const amc =
            await AMC.findByPk(
                data.amcId
            );

        if (!amc) {
            throw new Error(
                "AMC not found"
            );
        }

        if (
            amc.societyId !==
            data.societyId
        ) {
            throw new Error(
                "AMC does not belong to this society"
            );
        }

        if (
            amc.assetId !==
            data.assetId
        ) {
            throw new Error(
                "AMC does not belong to this asset"
            );
        }
    }


    const existing =
        await repository.findByScheduleCode(
            data.societyId,
            data.scheduleCode
        );

    if (existing) {
        throw new Error(
            "Schedule code already exists in this society"
        );
    }


    const startDate =
        new Date(data.startDate);

    const nextDueDate =
        new Date(data.nextDueDate);


    if (
        nextDueDate < startDate
    ) {
        throw new Error(
            "nextDueDate cannot be before startDate"
        );
    }


    if (
        data.frequencyType === "CUSTOM" &&
        (
            !data.frequencyValue ||
            Number(data.frequencyValue) <= 0
        )
    ) {

        throw new Error(
            "frequencyValue is required for CUSTOM frequency"
        );
    }


    return await repository.create(
        data
    );
};


const getAllSchedules = async (
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

    if (filters.vendorId) {
        where.vendorId =
            filters.vendorId;
    }

    if (filters.amcId) {
        where.amcId =
            filters.amcId;
    }

    if (filters.status) {
        where.status =
            filters.status;
    }

    if (filters.frequencyType) {
        where.frequencyType =
            filters.frequencyType;
    }

    return await repository.findAll(
        where
    );
};


const getScheduleById = async (
    id
) => {

    const schedule =
        await repository.findById(id);

    if (!schedule) {
        throw new Error(
            "Maintenance schedule not found"
        );
    }

    return schedule;
};


const getSchedulesByAssetId = async (
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


const updateSchedule = async (
    id,
    data
) => {

    const schedule =
        await repository.findById(id);

    if (!schedule) {
        throw new Error(
            "Maintenance schedule not found"
        );
    }


    if (
        data.societyId &&
        data.societyId !==
        schedule.societyId
    ) {

        throw new Error(
            "Schedule society cannot be changed"
        );
    }


    if (
        data.assetId &&
        data.assetId !==
        schedule.assetId
    ) {

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
            schedule.societyId
        ) {
            throw new Error(
                "Asset does not belong to this society"
            );
        }
    }


    if (
        data.nextDueDate &&
        data.startDate
    ) {

        if (
            new Date(data.nextDueDate) <
            new Date(data.startDate)
        ) {
            throw new Error(
                "nextDueDate cannot be before startDate"
            );
        }
    }


    return await repository.update(
        schedule,
        data
    );
};


const pauseSchedule = async (
    id
) => {

    const schedule =
        await repository.findById(id);

    if (!schedule) {
        throw new Error(
            "Maintenance schedule not found"
        );
    }

    return await repository.update(
        schedule,
        {
            status: "PAUSED"
        }
    );
};


const activateSchedule = async (
    id
) => {

    const schedule =
        await repository.findById(id);

    if (!schedule) {
        throw new Error(
            "Maintenance schedule not found"
        );
    }


    if (
        schedule.status === "CANCELLED"
    ) {
        throw new Error(
            "Cancelled schedule cannot be activated"
        );
    }


    return await repository.update(
        schedule,
        {
            status: "ACTIVE"
        }
    );
};


const completeSchedule = async (
    id
) => {

    const schedule =
        await repository.findById(id);

    if (!schedule) {
        throw new Error(
            "Maintenance schedule not found"
        );
    }


    return await repository.update(
        schedule,
        {
            status: "COMPLETED"
        }
    );
};


const cancelSchedule = async (
    id
) => {

    const schedule =
        await repository.findById(id);

    if (!schedule) {
        throw new Error(
            "Maintenance schedule not found"
        );
    }


    return await repository.update(
        schedule,
        {
            status: "CANCELLED"
        }
    );
};


const updateNextDueDate = async (
    id,
    nextDueDate
) => {

    const schedule =
        await repository.findById(id);

    if (!schedule) {
        throw new Error(
            "Maintenance schedule not found"
        );
    }


    if (!nextDueDate) {
        throw new Error(
            "nextDueDate is required"
        );
    }


    if (
        new Date(nextDueDate) <
        new Date(schedule.startDate)
    ) {

        throw new Error(
            "nextDueDate cannot be before startDate"
        );
    }


    return await repository.update(
        schedule,
        {
            lastMaintenanceDate:
                new Date(),

            nextDueDate
        }
    );
};


const deleteSchedule = async (
    id
) => {

    const schedule =
        await repository.findById(id);

    if (!schedule) {
        throw new Error(
            "Maintenance schedule not found"
        );
    }


    if (
        [
            "ACTIVE",
            "PAUSED"
        ].includes(
            schedule.status
        )
    ) {

        throw new Error(
            "Active or paused maintenance schedules cannot be deleted"
        );
    }


    return await repository.deleteSchedule(
        schedule
    );
};


module.exports = {
    createSchedule,
    getAllSchedules,
    getScheduleById,
    getSchedulesByAssetId,
    updateSchedule,
    pauseSchedule,
    activateSchedule,
    completeSchedule,
    cancelSchedule,
    updateNextDueDate,
    deleteSchedule
};

