
const assetQrService =
    require("./assetQr.service");


// ======================================================
// CREATE
// ======================================================

const createAssetQr = async (req, res) => {

    try {

        const qrTag =
            await assetQrService.createAssetQr(
                req.body
            );


        return res.status(201).json({

            success: true,

            message:
                "Asset QR tag created successfully",

            data: qrTag
        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


// ======================================================
// GET ALL
// ======================================================

const getAllAssetQr = async (req, res) => {

    try {

        const qrTags =
            await assetQrService.getAllAssetQr(
                req.query
            );


        return res.status(200).json({

            success: true,

            count:
                qrTags.length,

            data:
                qrTags
        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


// ======================================================
// GET BY ID
// ======================================================

const getAssetQrById = async (
    req,
    res
) => {

    try {

        const qrTag =
            await assetQrService.getAssetQrById(
                req.params.id
            );


        return res.status(200).json({

            success: true,

            data:
                qrTag
        });

    } catch (error) {

        return res.status(404).json({

            success: false,

            message:
                error.message
        });
    }
};


// ======================================================
// GET BY ASSET ID
// ======================================================

const getAssetQrByAssetId = async (
    req,
    res
) => {

    try {

        const qrTag =
            await assetQrService.getAssetQrByAssetId(
                req.params.assetId
            );


        return res.status(200).json({

            success: true,

            data:
                qrTag
        });

    } catch (error) {

        return res.status(404).json({

            success: false,

            message:
                error.message
        });
    }
};


// ======================================================
// GET BY QR CODE
// ======================================================

const getAssetQrByCode = async (
    req,
    res
) => {

    try {

        const qrTag =
            await assetQrService.getAssetQrByCode(
                req.params.qrCode
            );


        return res.status(200).json({

            success: true,

            data:
                qrTag
        });

    } catch (error) {

        return res.status(404).json({

            success: false,

            message:
                error.message
        });
    }
};


// ======================================================
// SCAN QR
// ======================================================

const scanAssetQr = async (
    req,
    res
) => {

    try {

        const result =
            await assetQrService.scanAssetQr(
                req.body.qrValue
            );


        return res.status(200).json({

            success: true,

            message:
                "Asset QR scanned successfully",

            data: result
        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


// ======================================================
// UPDATE
// ======================================================

const updateAssetQr = async (
    req,
    res
) => {

    try {

        const qrTag =
            await assetQrService.updateAssetQr(
                req.params.id,
                req.body
            );


        return res.status(200).json({

            success: true,

            message:
                "Asset QR tag updated successfully",

            data:
                qrTag
        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


// ======================================================
// ACTIVATE
// ======================================================

const activateAssetQr = async (
    req,
    res
) => {

    try {

        const qrTag =
            await assetQrService.activateAssetQr(
                req.params.id
            );


        return res.status(200).json({

            success: true,

            message:
                "Asset QR tag activated successfully",

            data:
                qrTag
        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


// ======================================================
// DEACTIVATE
// ======================================================

const deactivateAssetQr = async (
    req,
    res
) => {

    try {

        const qrTag =
            await assetQrService.deactivateAssetQr(
                req.params.id
            );


        return res.status(200).json({

            success: true,

            message:
                "Asset QR tag deactivated successfully",

            data:
                qrTag
        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


// ======================================================
// REGENERATE
// ======================================================

const regenerateAssetQr = async (
    req,
    res
) => {

    try {

        const qrTag =
            await assetQrService.regenerateAssetQr(
                req.params.id
            );


        return res.status(200).json({

            success: true,

            message:
                "Asset QR tag regenerated successfully",

            data:
                qrTag
        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


// ======================================================
// DELETE
// ======================================================

const deleteAssetQr = async (
    req,
    res
) => {

    try {

        const result =
            await assetQrService.deleteAssetQr(
                req.params.id
            );


        return res.status(200).json({

            success: true,

            ...result
        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message:
                error.message
        });
    }
};


module.exports = {

    createAssetQr,

    getAllAssetQr,

    getAssetQrById,

    getAssetQrByAssetId,

    getAssetQrByCode,

    scanAssetQr,

    updateAssetQr,

    activateAssetQr,

    deactivateAssetQr,

    regenerateAssetQr,

    deleteAssetQr
};

