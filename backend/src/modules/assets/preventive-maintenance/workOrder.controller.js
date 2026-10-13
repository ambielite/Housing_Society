
const service =
    require("./workOrder.service");


const createWorkOrder = async (
    req,
    res
) => {

    try {

        const workOrder =
            await service.createWorkOrder(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Work order created successfully",
            data: workOrder
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const getAllWorkOrders = async (
    req,
    res
) => {

    try {

        const workOrders =
            await service.getAllWorkOrders(
                req.query
            );

        res.status(200).json({
            success: true,
            count: workOrders.length,
            data: workOrders
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const getWorkOrderById = async (
    req,
    res
) => {

    try {

        const workOrder =
            await service.getWorkOrderById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: workOrder
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }
};


const getWorkOrdersByAssetId = async (
    req,
    res
) => {

    try {

        const workOrders =
            await service.getWorkOrdersByAssetId(
                req.params.assetId
            );

        res.status(200).json({
            success: true,
            count: workOrders.length,
            data: workOrders
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }
};


const assignWorkOrder = async (
    req,
    res
) => {

    try {

        const workOrder =
            await service.assignWorkOrder(
                req.params.id,
                req.body.assignedTo
            );

        res.status(200).json({
            success: true,
            message:
                "Work order assigned successfully",
            data: workOrder
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const startWorkOrder = async (
    req,
    res
) => {

    try {

        const workOrder =
            await service.startWorkOrder(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Work order started successfully",
            data: workOrder
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const putWorkOrderOnHold = async (
    req,
    res
) => {

    try {

        const workOrder =
            await service.putWorkOrderOnHold(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Work order put on hold",
            data: workOrder
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const completeWorkOrder = async (
    req,
    res
) => {

    try {

        const workOrder =
            await service.completeWorkOrder(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Work order completed successfully",
            data: workOrder
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const cancelWorkOrder = async (
    req,
    res
) => {

    try {

        const workOrder =
            await service.cancelWorkOrder(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Work order cancelled successfully",
            data: workOrder
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


const deleteWorkOrder = async (
    req,
    res
) => {

    try {

        await service.deleteWorkOrder(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message:
                "Work order deleted successfully"
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
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

