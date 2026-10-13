
const express = require("express");

const router = express.Router();

const inventoryController =
    require("./inventory.controller");


// Create inventory item
router.post(
    "/",
    inventoryController.createInventory
);


// Get all inventory
router.get(
    "/",
    inventoryController.getAllInventory
);


// Get low stock items
router.get(
    "/low-stock",
    inventoryController.getLowStockInventory
);


// Get inventory item by ID
router.get(
    "/:id",
    inventoryController.getInventoryById
);


// Update inventory item
router.put(
    "/:id",
    inventoryController.updateInventory
);


// Activate inventory item
router.post(
    "/:id/activate",
    inventoryController.activateInventory
);


// Deactivate inventory item
router.post(
    "/:id/deactivate",
    inventoryController.deactivateInventory
);


// Delete inventory item
router.delete(
    "/:id",
    inventoryController.deleteInventory
);


module.exports = router;

