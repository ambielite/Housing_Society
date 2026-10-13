const categoryService =
    require("./assetCategory.service");


// CREATE
const createCategory = async (
    req,
    res
) => {

    try {

        const category =
            await categoryService.createCategory(
                req.body
            );

        res.status(201).json({

            success: true,

            message:
                "Asset category created successfully",

            data: category
        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message: error.message
        });
    }
};


// GET ALL
const getAllCategories = async (
    req,
    res
) => {

    try {

        const categories =
            await categoryService.getAllCategories(
                req.query
            );

        res.status(200).json({

            success: true,

            count: categories.length,

            data: categories
        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message
        });
    }
};


// GET BY ID
const getCategoryById = async (
    req,
    res
) => {

    try {

        const category =
            await categoryService.getCategoryById(
                req.params.id
            );

        res.status(200).json({

            success: true,

            data: category
        });

    } catch (error) {

        res.status(404).json({

            success: false,

            message: error.message
        });
    }
};


// UPDATE
const updateCategory = async (
    req,
    res
) => {

    try {

        const category =
            await categoryService.updateCategory(
                req.params.id,
                req.body
            );

        res.status(200).json({

            success: true,

            message:
                "Asset category updated successfully",

            data: category
        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message: error.message
        });
    }
};


// ACTIVATE
const activateCategory = async (
    req,
    res
) => {

    try {

        const category =
            await categoryService.activateCategory(
                req.params.id
            );

        res.status(200).json({

            success: true,

            message:
                "Asset category activated successfully",

            data: category
        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message: error.message
        });
    }
};


// DEACTIVATE
const deactivateCategory = async (
    req,
    res
) => {

    try {

        const category =
            await categoryService.deactivateCategory(
                req.params.id
            );

        res.status(200).json({

            success: true,

            message:
                "Asset category deactivated successfully",

            data: category
        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message: error.message
        });
    }
};


// DELETE
const deleteCategory = async (
    req,
    res
) => {

    try {

        const result =
            await categoryService.deleteCategory(
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
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    activateCategory,
    deactivateCategory,
    deleteCategory
};