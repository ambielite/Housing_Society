
const Inventory =
    require("./inventory.model");

const Society =
    require("../../societies/society/society.model");

const inventoryRepository =
    require("./inventory.repository");

const {
    validateCreateInventory,
    validateUpdateInventory
} = require("./inventory.validation");

const validateStockLevels = (data) => {

    const minimum =
        data.minimumStockLevel !== undefined
            ? Number(data.minimumStockLevel)
            : 0;

    const reorder =
        data.reorderLevel !== undefined
            ? Number(data.reorderLevel)
            : 0;

    const maximum =
        data.maximumStockLevel !== undefined &&
        data.maximumStockLevel !== null &&
        data.maximumStockLevel !== ""
            ? Number(data.maximumStockLevel)
            : null;

    if (reorder < minimum) {
        throw new Error(
            "reorderLevel cannot be less than minimumStockLevel"
        );
    }

    if (
        maximum !== null &&
        maximum < reorder
    ) {
        throw new Error(
            "maximumStockLevel cannot be less than reorderLevel"
        );
    }
};

const hasStockLevel = (value) =>
    value !== undefined && value !== null && value !== "";

const createInventory = async (data) => {

    data = { ...data };

    // A missing reorder threshold means "reorder at the minimum level".
    // Keep the persisted values valid even for API clients that omit the field.
    if (!hasStockLevel(data.minimumStockLevel)) {
        data.minimumStockLevel = 0;
    }
    if (!hasStockLevel(data.reorderLevel)) {
        data.reorderLevel = data.minimumStockLevel;
    }
    if (data.currentStock === "") data.currentStock = undefined;
    if (data.maximumStockLevel === "") data.maximumStockLevel = null;
    if (data.unitCost === "") data.unitCost = null;

    const errors =
        validateCreateInventory(data);

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

    validateStockLevels(data);

    const existingCode =
        await inventoryRepository.findByItemCode(
            data.societyId,
            data.itemCode
        );

    if (existingCode) {
        throw new Error(
            "Inventory item code already exists in this society"
        );
    }

    const existingName =
        await inventoryRepository.findByItemName(
            data.societyId,
            data.itemName
        );

    if (existingName) {
        throw new Error(
            "Inventory item name already exists in this society"
        );
    }

    if (
        data.currentStock === undefined ||
        data.currentStock === null
    ) {
        data.currentStock = 0;
    }

    return await inventoryRepository.create(
        data
    );
};

const getAllInventory = async (filters = {}) => {

    const where = {};

    if (filters.societyId) {
        where.societyId =
            filters.societyId;
    }

    if (filters.category) {
        where.category =
            filters.category;
    }

    if (filters.status) {
        where.status =
            filters.status;
    }

    if (filters.vendorId) {
        where.vendorId =
            filters.vendorId;
    }

    if (filters.storageLocation) {
        where.storageLocation =
            filters.storageLocation;
    }

    return await inventoryRepository.findAll(
        where
    );
};

const getInventoryById = async (id) => {

    const inventory =
        await inventoryRepository.findById(
            id
        );

    if (!inventory) {
        throw new Error(
            "Inventory item not found"
        );
    }

    return inventory;
};

const updateInventory = async (
    id,
    data
) => {

    data = { ...data };

    const inventory =
        await inventoryRepository.findById(
            id
        );

    if (!inventory) {
        throw new Error(
            "Inventory item not found"
        );
    }

    const errors =
        validateUpdateInventory(data);

    if (errors.length > 0) {
        throw new Error(
            errors.join(", ")
        );
    }

    if (data.societyId) {
        throw new Error(
            "societyId cannot be changed"
        );
    }

    // Treat blank threshold fields as omitted on partial updates; they must
    // not be coerced to zero and accidentally trigger the threshold rule.
    for (const field of ["minimumStockLevel", "reorderLevel"]) {
        if (data[field] === "" || data[field] === null) delete data[field];
    }
    if (data.maximumStockLevel === "") data.maximumStockLevel = null;

    if (data.itemCode) {

        const existingCode =
            await inventoryRepository.findByItemCode(
                inventory.societyId,
                data.itemCode
            );

        if (
            existingCode &&
            existingCode.id !== inventory.id
        ) {
            throw new Error(
                "Inventory item code already exists in this society"
            );
        }
    }

    if (data.itemName) {

        const existingName =
            await inventoryRepository.findByItemName(
                inventory.societyId,
                data.itemName
            );

        if (
            existingName &&
            existingName.id !== inventory.id
        ) {
            throw new Error(
                "Inventory item name already exists in this society"
            );
        }
    }

    const stockLevelData = {
        minimumStockLevel:
            hasStockLevel(data.minimumStockLevel)
                ? data.minimumStockLevel
                : inventory.minimumStockLevel,

        reorderLevel:
            hasStockLevel(data.reorderLevel)
                ? data.reorderLevel
                : inventory.reorderLevel,

        maximumStockLevel:
            data.maximumStockLevel !== undefined
                ? data.maximumStockLevel
                : inventory.maximumStockLevel
    };

    // If the minimum is raised without specifying a new reorder level,
    // raise the existing threshold with it. An explicitly supplied lower
    // reorder level is still rejected by validateStockLevels.
    if (
        hasStockLevel(data.minimumStockLevel) &&
        !hasStockLevel(data.reorderLevel) &&
        Number(stockLevelData.reorderLevel) < Number(stockLevelData.minimumStockLevel)
    ) {
        data.reorderLevel = stockLevelData.minimumStockLevel;
        stockLevelData.reorderLevel = data.reorderLevel;
    }

    validateStockLevels(
        stockLevelData
    );

    return await inventoryRepository.update(
        inventory,
        data
    );
};

const activateInventory = async (id) => {

    const inventory =
        await inventoryRepository.findById(
            id
        );

    if (!inventory) {
        throw new Error(
            "Inventory item not found"
        );
    }

    if (
        inventory.status === "ACTIVE"
    ) {
        throw new Error(
            "Inventory item is already active"
        );
    }

    return await inventoryRepository.update(
        inventory,
        {
            status: "ACTIVE"
        }
    );
};

const deactivateInventory = async (id) => {

    const inventory =
        await inventoryRepository.findById(
            id
        );

    if (!inventory) {
        throw new Error(
            "Inventory item not found"
        );
    }

    if (
        inventory.status === "INACTIVE"
    ) {
        throw new Error(
            "Inventory item is already inactive"
        );
    }

    if (
        Number(inventory.currentStock) > 0
    ) {
        throw new Error(
            "Inventory item cannot be deactivated while stock is available"
        );
    }

    return await inventoryRepository.update(
        inventory,
        {
            status: "INACTIVE"
        }
    );
};

const getLowStockInventory = async (
    filters = {}
) => {

    const where = {};

    if (filters.societyId) {
        where.societyId =
            filters.societyId;
    }

    if (filters.status) {
        where.status =
            filters.status;
    } else {
        where.status = "ACTIVE";
    }

    const inventory =
        await inventoryRepository.findLowStock(
            where
        );

    return inventory.filter(
        (item) => {
            return (
                Number(item.currentStock) <=
                Number(item.reorderLevel)
            );
        }
    );
};

const deleteInventory = async (id) => {

    const inventory =
        await inventoryRepository.findById(
            id
        );

    if (!inventory) {
        throw new Error(
            "Inventory item not found"
        );
    }

    if (
        Number(inventory.currentStock) > 0
    ) {
        throw new Error(
            "Inventory item cannot be deleted while stock is available"
        );
    }

    await inventoryRepository.deleteInventory(
        inventory
    );

    return {
        message:
            "Inventory item deleted successfully"
    };
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

