
const inventoryService =
    require("./inventory.service");

const createInventory = async (
    req,
    res
) => {

    try {

        const inventory =
            await inventoryService.createInventory(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Inventory item created successfully",
            data: inventory
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getAllInventory = async (
    req,
    res
) => {

    try {

        const inventory =
            await inventoryService.getAllInventory(
                req.query
            );

        res.status(200).json({
            success: true,
            count: inventory.length,
            data: inventory
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getInventoryById = async (
    req,
    res
) => {

    try {

        const inventory =
            await inventoryService.getInventoryById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: inventory
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

const updateInventory = async (
    req,
    res
) => {

    try {

        const inventory =
            await inventoryService.updateInventory(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Inventory item updated successfully",
            data: inventory
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const activateInventory = async (
    req,
    res
) => {

    try {

        const inventory =
            await inventoryService.activateInventory(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Inventory item activated successfully",
            data: inventory
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const deactivateInventory = async (
    req,
    res
) => {

    try {

        const inventory =
            await inventoryService.deactivateInventory(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Inventory item deactivated successfully",
            data: inventory
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getLowStockInventory = async (
    req,
    res
) => {

    try {

        const inventory =
            await inventoryService.getLowStockInventory(
                req.query
            );

        res.status(200).json({
            success: true,
            count: inventory.length,
            data: inventory
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const deleteInventory = async (
    req,
    res
) => {

    try {

        const result =
            await inventoryService.deleteInventory(
                req.params.id
            );

        res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createInventory,
    getAllInventory,
    getInventoryById,
    updateInventory,
    activateInventory,
    deactivateInventory,
    getLowStockInventory,
    deleteInventory
};

