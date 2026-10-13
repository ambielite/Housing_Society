
const assetRepository = require("./asset.repository");

const {
    validateCreateAsset,
    validateUpdateAsset
} = require("./asset.validation");

const Society = require("../../societies/society/society.model");
const Tower = require("../../societies/tower/tower.model");
const Floor = require("../../societies/floor/floor.model");
const Unit = require("../../societies/unit/unit.model");
const AssetCategory = require("../asset-category/assetCategory.model");


// ======================================================
// CREATE ASSET
// ======================================================

const createAsset = async (data) => {

    const errors = validateCreateAsset(data);

    if (errors.length > 0) {
        throw new Error(errors.join(", "));
    }


    // --------------------------------------------------
    // CHECK SOCIETY
    // --------------------------------------------------

    const society =
        await Society.findByPk(data.societyId);

    if (!society) {
        throw new Error("Society not found");
    }


    // --------------------------------------------------
    // CHECK DUPLICATE ASSET CODE
    // --------------------------------------------------

    const existingAsset =
        await assetRepository.findByAssetCode(
            data.societyId,
            data.assetCode
        );

    if (existingAsset) {
        throw new Error(
            "Asset code already exists in this society"
        );
    }


    // --------------------------------------------------
    // CHECK ASSET CATEGORY
    // --------------------------------------------------

    if (data.categoryId) {

        const category =
            await AssetCategory.findByPk(
                data.categoryId
            );

        if (!category) {
            throw new Error(
                "Asset category not found"
            );
        }


        // Category must belong to same society

        if (
            category.societyId !==
            data.societyId
        ) {
            throw new Error(
                "Asset category does not belong to this society"
            );
        }


        // Only active category can be assigned

        if (category.status !== "ACTIVE") {
            throw new Error(
                "Inactive asset category cannot be assigned"
            );
        }
    }


    // --------------------------------------------------
    // VALIDATE TOWER
    // --------------------------------------------------

    if (data.towerId) {

        const tower =
            await Tower.findByPk(
                data.towerId
            );

        if (!tower) {
            throw new Error(
                "Tower not found"
            );
        }
    }


    // --------------------------------------------------
    // VALIDATE FLOOR
    // --------------------------------------------------

    if (data.floorId) {

        const floor =
            await Floor.findByPk(
                data.floorId
            );

        if (!floor) {
            throw new Error(
                "Floor not found"
            );
        }
    }


    // --------------------------------------------------
    // VALIDATE UNIT
    // --------------------------------------------------

    if (data.unitId) {

        const unit =
            await Unit.findByPk(
                data.unitId
            );

        if (!unit) {
            throw new Error(
                "Unit not found"
            );
        }
    }


    // --------------------------------------------------
    // DEFAULT CURRENT VALUE
    // --------------------------------------------------

    if (
        data.currentValue === undefined ||
        data.currentValue === null
    ) {

        data.currentValue =
            data.purchaseCost || 0;
    }


    // --------------------------------------------------
    // CREATE ASSET
    // --------------------------------------------------

    const asset =
        await assetRepository.create(data);

    return asset;
};


// ======================================================
// GET ALL ASSETS
// ======================================================

const getAllAssets = async (filters = {}) => {

    const where = {};


    if (filters.societyId) {

        where.societyId =
            filters.societyId;
    }


    if (filters.assetType) {

        where.assetType =
            filters.assetType;
    }


    if (filters.status) {

        where.status =
            filters.status;
    }


    if (filters.condition) {

        where.condition =
            filters.condition;
    }


    if (filters.categoryId) {

        where.categoryId =
            filters.categoryId;
    }


    if (filters.towerId) {

        where.towerId =
            filters.towerId;
    }


    if (filters.floorId) {

        where.floorId =
            filters.floorId;
    }


    if (filters.unitId) {

        where.unitId =
            filters.unitId;
    }


    return await assetRepository.findAll(
        where
    );
};


// ======================================================
// GET ASSET BY ID
// ======================================================

const getAssetById = async (id) => {

    const asset =
        await assetRepository.findById(id);

    if (!asset) {
        throw new Error(
            "Asset not found"
        );
    }

    return asset;
};


// ======================================================
// UPDATE ASSET
// ======================================================

const updateAsset = async (id, data) => {

    const asset =
        await assetRepository.findById(id);

    if (!asset) {
        throw new Error(
            "Asset not found"
        );
    }


    // --------------------------------------------------
    // VALIDATE REQUEST
    // --------------------------------------------------

    const errors =
        validateUpdateAsset(data);

    if (errors.length > 0) {
        throw new Error(
            errors.join(", ")
        );
    }


    // --------------------------------------------------
    // DON'T ALLOW SOCIETY CHANGE
    // --------------------------------------------------

    if (data.societyId) {

        delete data.societyId;
    }


    // --------------------------------------------------
    // CHECK DUPLICATE ASSET CODE
    // --------------------------------------------------

    if (data.assetCode) {

        const existingAsset =
            await assetRepository.findByAssetCode(
                asset.societyId,
                data.assetCode
            );


        if (
            existingAsset &&
            existingAsset.id !== asset.id
        ) {

            throw new Error(
                "Asset code already exists in this society"
            );
        }
    }


    // --------------------------------------------------
    // CHECK CATEGORY
    // --------------------------------------------------

    if (data.categoryId) {

        const category =
            await AssetCategory.findByPk(
                data.categoryId
            );


        if (!category) {

            throw new Error(
                "Asset category not found"
            );
        }


        // Category must belong to same society

        if (
            category.societyId !==
            asset.societyId
        ) {

            throw new Error(
                "Asset category does not belong to this society"
            );
        }


        // Category must be active

        if (category.status !== "ACTIVE") {

            throw new Error(
                "Inactive asset category cannot be assigned"
            );
        }
    }


    // --------------------------------------------------
    // CHECK STATUS TRANSITIONS
    // --------------------------------------------------

    // Disposed asset cannot be reactivated

    if (
        asset.status === "DISPOSED" &&
        data.status &&
        data.status !== "DISPOSED"
    ) {

        throw new Error(
            "Disposed asset cannot be reactivated"
        );
    }


    // Retired asset cannot directly become active

    if (
        asset.status === "RETIRED" &&
        data.status === "ACTIVE"
    ) {

        throw new Error(
            "Retired asset cannot be directly activated"
        );
    }


    // --------------------------------------------------
    // UPDATE ASSET
    // --------------------------------------------------

    return await assetRepository.update(
        asset,
        data
    );
};


// ======================================================
// ACTIVATE ASSET
// ======================================================

const activateAsset = async (id) => {

    const asset =
        await assetRepository.findById(id);

    if (!asset) {

        throw new Error(
            "Asset not found"
        );
    }


    // Disposed cannot be activated

    if (asset.status === "DISPOSED") {

        throw new Error(
            "Disposed asset cannot be activated"
        );
    }


    // Retired cannot be activated

    if (asset.status === "RETIRED") {

        throw new Error(
            "Retired asset cannot be activated"
        );
    }


    await assetRepository.update(
        asset,
        {
            status: "ACTIVE",

            commissionedDate:
                asset.commissionedDate ||
                new Date()
        }
    );


    return asset;
};


// ======================================================
// PUT ASSET UNDER MAINTENANCE
// ======================================================

const putUnderMaintenance = async (id) => {

    const asset =
        await assetRepository.findById(id);

    if (!asset) {

        throw new Error(
            "Asset not found"
        );
    }


    if (
        asset.status === "RETIRED" ||
        asset.status === "DISPOSED"
    ) {

        throw new Error(
            "Retired or disposed asset cannot be put under maintenance"
        );
    }


    await assetRepository.update(
        asset,
        {
            status: "UNDER_MAINTENANCE"
        }
    );


    return asset;
};


// ======================================================
// RETIRE ASSET
// ======================================================

const retireAsset = async (
    id,
    retirementDate
) => {

    const asset =
        await assetRepository.findById(id);

    if (!asset) {

        throw new Error(
            "Asset not found"
        );
    }


    // Disposed asset cannot be retired

    if (asset.status === "DISPOSED") {

        throw new Error(
            "Disposed asset cannot be retired"
        );
    }


    await assetRepository.update(
        asset,
        {
            status: "RETIRED",

            retirementDate:
                retirementDate ||
                new Date()
        }
    );


    return asset;
};


// ======================================================
// DISPOSE ASSET
// ======================================================

const disposeAsset = async (id) => {

    const asset =
        await assetRepository.findById(id);

    if (!asset) {

        throw new Error(
            "Asset not found"
        );
    }


    // Already disposed

    if (asset.status === "DISPOSED") {

        throw new Error(
            "Asset is already disposed"
        );
    }


    // Must be retired first

    if (asset.status !== "RETIRED") {

        throw new Error(
            "Asset must be retired before disposal"
        );
    }


    await assetRepository.update(
        asset,
        {
            status: "DISPOSED"
        }
    );


    return asset;
};


// ======================================================
// DELETE ASSET
// ======================================================

const deleteAsset = async (id) => {

    const asset =
        await assetRepository.findById(id);

    if (!asset) {

        throw new Error(
            "Asset not found"
        );
    }


    // Active asset cannot be deleted

    if (
        asset.status === "ACTIVE" ||
        asset.status === "UNDER_MAINTENANCE"
    ) {

        throw new Error(
            "Active or under-maintenance asset cannot be deleted"
        );
    }


    await assetRepository.deleteAsset(
        asset
    );


    return {
        message:
            "Asset deleted successfully"
    };
};


// ======================================================
// EXPORTS
// ======================================================

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

