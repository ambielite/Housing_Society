const AssetCategory = require("./assetCategory.model");


// CREATE
const create = async (data) => {

    return await AssetCategory.create(data);
};


// FIND ALL
const findAll = async (where = {}) => {

    return await AssetCategory.findAll({
        where,
        order: [
            ["categoryName", "ASC"]
        ]
    });
};


// FIND BY ID
const findById = async (id) => {

    return await AssetCategory.findByPk(id);
};


// FIND BY CODE
const findByCategoryCode = async (
    societyId,
    categoryCode
) => {

    return await AssetCategory.findOne({
        where: {
            societyId,
            categoryCode
        }
    });
};


// FIND BY NAME
const findByCategoryName = async (
    societyId,
    categoryName
) => {

    return await AssetCategory.findOne({
        where: {
            societyId,
            categoryName
        }
    });
};


// UPDATE
const update = async (
    category,
    data
) => {

    return await category.update(data);
};


// DELETE
const deleteCategory = async (
    category
) => {

    return await category.destroy();
};


module.exports = {
    create,
    findAll,
    findById,
    findByCategoryCode,
    findByCategoryName,
    update,
    deleteCategory
};