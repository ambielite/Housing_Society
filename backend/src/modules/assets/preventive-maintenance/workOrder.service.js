
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
    require("./workOrder.repository");

const {
    validateCreateWorkOrder
} = require("./workOrder.validation");


const generateWorkOrderNumber = () => {

    return `WO-${Date.now()}-${Math.floor(
        Math.random() * 1000
    )}`;
};


const createWorkOrder = async (
    data
) => {

    const errors =
        validateCreateWorkOrder(data);

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


    if (data.scheduleId) {

        const schedule =
            await MaintenanceSchedule.findByPk(
                data.scheduleId
            );

        if (!schedule) {
            throw new Error(
                "Maintenance schedule not found"
            );
        }


        if (
            schedule.assetId !==
            data.assetId
        ) {

            throw new Error(
                "Maintenance schedule does not belong to this asset"
            );
        }
    }


    let workOrderNumber =
        data.workOrderNumber;

    if (!workOrderNumber) {
        workOrderNumber =
            generateWorkOrderNumber();
    }


    const existing =
        await repository.findByWorkOrderNumber(
            data.societyId,
            workOrderNumber
        );

    if (existing) {
        throw new Error(
            "Work order number already exists"
        );
    }


    data.workOrderNumber =
        workOrderNumber;


    return await repository.create(
        data
    );
};


const getAllWorkOrders = async (
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


    if (filters.scheduleId) {
        where.scheduleId =
            filters.scheduleId;
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


const getWorkOrderById = async (
    id
) => {

    const workOrder =
        await repository.findById(id);

    if (!workOrder) {
        throw new Error(
            "Work order not found"
        );
    }

    return workOrder;
};


const getWorkOrdersByAssetId = async (
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


const assignWorkOrder = async (
    id,
    assignedTo
) => {

    const workOrder =
        await repository.findById(id);

    if (!workOrder) {
        throw new Error(
            "Work order not found"
        );
    }


    if (
        workOrder.status === "CANCELLED"
    ) {

        throw new Error(
            "Cancelled work order cannot be assigned"
        );
    }


    if (!assignedTo) {
        throw new Error(
            "assignedTo is required"
        );
    }


    return await repository.update(
        workOrder,
        {
            assignedTo,
            status: "ASSIGNED"
        }
    );
};


const startWorkOrder = async (
    id
) => {

    const workOrder =
        await repository.findById(id);

    if (!workOrder) {
        throw new Error(
            "Work order not found"
        );
    }


    if (
        [
            "COMPLETED",
            "CANCELLED"
        ].includes(
            workOrder.status
        )
    ) {

        throw new Error(
            "This work order cannot be started"
        );
    }


    return await repository.update(
        workOrder,
        {
            status: "IN_PROGRESS",
            startedAt: new Date()
        }
    );
};


const putWorkOrderOnHold = async (
    id
) => {

    const workOrder =
        await repository.findById(id);

    if (!workOrder) {
        throw new Error(
            "Work order not found"
        );
    }


    if (
        [
            "COMPLETED",
            "CANCELLED"
        ].includes(
            workOrder.status
        )
    ) {

        throw new Error(
            "Completed or cancelled work order cannot be put on hold"
        );
    }


    return await repository.update(
        workOrder,
        {
            status: "ON_HOLD"
        }
    );
};


const completeWorkOrder = async (
    id,
    data
) => {

    const workOrder =
        await repository.findById(id);

    if (!workOrder) {
        throw new Error(
            "Work order not found"
        );
    }


    if (
        [
            "COMPLETED",
            "CANCELLED"
        ].includes(
            workOrder.status
        )
    ) {

        throw new Error(
            "This work order cannot be completed"
        );
    }


    if (
        data.actualCost !== undefined &&
        (
            Number.isNaN(
                Number(data.actualCost)
            ) ||
            Number(data.actualCost) < 0
        )
    ) {

        throw new Error(
            "actualCost must be a valid non-negative number"
        );
    }


    return await repository.update(
        workOrder,
        {
            status: "COMPLETED",

            completedAt:
                new Date(),

            actualCost:
                data.actualCost !== undefined
                    ? data.actualCost
                    : workOrder.actualCost,

            completionNotes:
                data.completionNotes ||
                workOrder.completionNotes
        }
    );
};


const cancelWorkOrder = async (
    id
) => {

    const workOrder =
        await repository.findById(id);

    if (!workOrder) {
        throw new Error(
            "Work order not found"
        );
    }


    if (
        workOrder.status === "COMPLETED"
    ) {

        throw new Error(
            "Completed work order cannot be cancelled"
        );
    }


    return await repository.update(
        workOrder,
        {
            status: "CANCELLED"
        }
    );
};


const deleteWorkOrder = async (
    id
) => {

    const workOrder =
        await repository.findById(id);

    if (!workOrder) {
        throw new Error(
            "Work order not found"
        );
    }


    if (
        [
            "IN_PROGRESS",
            "COMPLETED"
        ].includes(
            workOrder.status
        )
    ) {

        throw new Error(
            "Work order cannot be deleted after work has started"
        );
    }


    return await repository.deleteWorkOrder(
        workOrder
    );
};


module.exports = {
    createWorkOrder,
    getAllWorkOrders,
    getWorkOrderById,
    getWorkOrdersByAssetId,
    assignWorkOrder,
    startWorkOrder,
    putWorkOrderOnHold,
    completeWorkOrder,
    cancelWorkOrder,
    deleteWorkOrder
};

