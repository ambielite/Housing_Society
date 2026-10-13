
const Inventory =
    require("./inventory.model");

const create = async (data) => {
    return await Inventory.create(data);
};

const findAll = async (where = {}) => {
    return await Inventory.findAll({
        where,
        order: [
            ["itemName", "ASC"]
        ]
    });
};

const findById = async (id) => {
    return await Inventory.findByPk(id);
};

const findByItemCode = async (
    societyId,
    itemCode
) => {
    return await Inventory.findOne({
        where: {
            societyId,
            itemCode
        }
    });
};

const findByItemName = async (
    societyId,
    itemName
) => {
    return await Inventory.findOne({
        where: {
            societyId,
            itemName
        }
    });
};

const findLowStock = async (where = {}) => {
    return await Inventory.findAll({
        where,
        order: [
            ["currentStock", "ASC"]
        ]
    });
};

const update = async (inventory, data) => {
    return await inventory.update(data);
};

const deleteInventory = async (inventory) => {
    return await inventory.destroy();
};

module.exports = {
    create,
    findAll,
    findById,
    findByItemCode,
    findByItemName,
    findLowStock,
    update,
    deleteInventory
};

