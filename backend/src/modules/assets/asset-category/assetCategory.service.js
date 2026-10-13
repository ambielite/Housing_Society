const categoryRepository =
    require("./assetCategory.repository");

const {
    validateCreateCategory,
    validateUpdateCategory
} = require("./assetCategory.validation");

const Society =
    require("../../societies/society/society.model");

const Asset =
    require("../asset/asset.model");


// CREATE CATEGORY
const createCategory = async (data) => {

    const errors =
        validateCreateCategory(data);

    if (errors.length > 0) {
        throw new Error(
            errors.join(", ")
        );
    }


    // Check society
    const society =
        await Society.findByPk(
            data.societyId
        );

    if (!society) {
        throw new Error(
            "Society not found"
        );
    }


    // Check duplicate code
    const existingCode =
        await categoryRepository.findByCategoryCode(
            data.societyId,
            data.categoryCode
        );

    if (existingCode) {
        throw new Error(
            "Category code already exists in this society"
        );
    }


    // Check duplicate name
    const existingName =
        await categoryRepository.findByCategoryName(
            data.societyId,
            data.categoryName
        );

    if (existingName) {
        throw new Error(
            "Category name already exists in this society"
        );
    }


    const category =
        await categoryRepository.create(
            data
        );

    return category;
};


// GET ALL
const getAllCategories = async (
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
    }

    return await categoryRepository.findAll(
        where
    );
};


// GET BY ID
const getCategoryById = async (id) => {

    const category =
        await categoryRepository.findById(
            id
        );

    if (!category) {
        throw new Error(
            "Asset category not found"
        );
    }

    return category;
};


// UPDATE
const updateCategory = async (
    id,
    data
) => {

    const category =
        await categoryRepository.findById(
            id
        );

    if (!category) {
        throw new Error(
            "Asset category not found"
        );
    }


    const errors =
        validateUpdateCategory(data);

    if (errors.length > 0) {

        throw new Error(
            errors.join(", ")
        );
    }


    // Don't allow society change
    if (data.societyId) {

        delete data.societyId;
    }


    // Check duplicate code
    if (data.categoryCode) {

        const existingCode =
            await categoryRepository.findByCategoryCode(
                category.societyId,
                data.categoryCode
            );

        if (
            existingCode &&
            existingCode.id !== category.id
        ) {

            throw new Error(
                "Category code already exists in this society"
            );
        }
    }


    // Check duplicate name
    if (data.categoryName) {

        const existingName =
            await categoryRepository.findByCategoryName(
                category.societyId,
                data.categoryName
            );

        if (
            existingName &&
            existingName.id !== category.id
        ) {

            throw new Error(
                "Category name already exists in this society"
            );
        }
    }


    return await categoryRepository.update(
        category,
        data
    );
};


// ACTIVATE
const activateCategory = async (id) => {

    const category =
        await categoryRepository.findById(
            id
        );

    if (!category) {

        throw new Error(
            "Asset category not found"
        );
    }


    await categoryRepository.update(
        category,
        {
            status: "ACTIVE"
        }
    );


    return category;
};


// DEACTIVATE
const deactivateCategory = async (id) => {

    const category =
        await categoryRepository.findById(
            id
        );

    if (!category) {

        throw new Error(
            "Asset category not found"
        );
    }


    // Check whether assets are using it
    const assetCount =
        await Asset.count({
            where: {
                categoryId: id
            }
        });


    if (assetCount > 0) {

        throw new Error(
            "Category cannot be deactivated because assets are using this category"
        );
    }


    await categoryRepository.update(
        category,
        {
            status: "INACTIVE"
        }
    );


    return category;
};


// DELETE
const deleteCategory = async (id) => {

    const category =
        await categoryRepository.findById(
            id
        );

    if (!category) {

        throw new Error(
            "Asset category not found"
        );
    }


    const assetCount =
        await Asset.count({
            where: {
                categoryId: id
            }
        });


    if (assetCount > 0) {

        throw new Error(
            "Category cannot be deleted because assets are using this category"
        );
    }


    await categoryRepository.deleteCategory(
        category
    );


    return {
        message:
            "Asset category deleted successfully"
    };
};


module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    activateCategory,
    deactivateCategory,
    deleteCategory
};