const assetService = require("./asset.service");


// CREATE
const createAsset = async (req, res) => {

    try {

        const asset =
            await assetService.createAsset(req.body);

        res.status(201).json({
            success: true,
            message: "Asset created successfully",
            data: asset
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// GET ALL
const getAllAssets = async (req, res) => {

    try {

        const assets =
            await assetService.getAllAssets(
                req.query
            );

        res.status(200).json({
            success: true,
            count: assets.length,
            data: assets
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// GET BY ID
const getAssetById = async (req, res) => {

    try {

        const asset =
            await assetService.getAssetById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            data: asset
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


// UPDATE
const updateAsset = async (req, res) => {

    try {

        const asset =
            await assetService.updateAsset(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Asset updated successfully",
            data: asset
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// ACTIVATE
const activateAsset = async (req, res) => {

    try {

        const asset =
            await assetService.activateAsset(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Asset activated successfully",
            data: asset
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// MAINTENANCE
const putUnderMaintenance = async (req, res) => {

    try {

        const asset =
            await assetService.putUnderMaintenance(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Asset put under maintenance successfully",
            data: asset
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// RETIRE
const retireAsset = async (req, res) => {

    try {

        const asset =
            await assetService.retireAsset(
                req.params.id,
                req.body.retirementDate
            );

        res.status(200).json({
            success: true,
            message: "Asset retired successfully",
            data: asset
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// DISPOSE
const disposeAsset = async (req, res) => {

    try {

        const asset =
            await assetService.disposeAsset(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Asset disposed successfully",
            data: asset
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// DELETE
const deleteAsset = async (req, res) => {

    try {

        const result =
            await assetService.deleteAsset(
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
    createAsset,
    getAllAssets,
    getAssetById,
    updateAsset,
    activateAsset,
    putUnderMaintenance,
    retireAsset,
    disposeAsset,
    deleteAsset
};