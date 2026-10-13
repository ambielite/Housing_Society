
const assetDocumentService =
    require("./assetDocument.service");


// ======================================================
// CREATE
// ======================================================

const createAssetDocument = async (
    req,
    res
) => {

    try {

        const document =
            await assetDocumentService.createAssetDocument(
                req.body,
                req.file
            );


        return res.status(201).json({

            success: true,

            message:
                "Asset document created successfully",

            data:
                document
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

const getAllAssetDocuments = async (
    req,
    res
) => {

    try {

        const documents =
            await assetDocumentService.getAllAssetDocuments(
                req.query
            );


        return res.status(200).json({

            success: true,

            count:
                documents.length,

            data:
                documents
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

const getAssetDocumentById = async (
    req,
    res
) => {

    try {

        const document =
            await assetDocumentService.getAssetDocumentById(
                req.params.id
            );


        return res.status(200).json({

            success: true,

            data:
                document
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
// GET BY ASSET
// ======================================================

const getAssetDocumentsByAssetId = async (
    req,
    res
) => {

    try {

        const documents =
            await assetDocumentService.getAssetDocumentsByAssetId(
                req.params.assetId
            );


        return res.status(200).json({

            success: true,

            count:
                documents.length,

            data:
                documents
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
// GET WARRANTY
// ======================================================

const getWarrantyDocuments = async (
    req,
    res
) => {

    try {

        const documents =
            await assetDocumentService.getWarrantyDocuments(
                req.params.assetId
            );


        return res.status(200).json({

            success: true,

            count:
                documents.length,

            data:
                documents
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
// UPDATE
// ======================================================

const updateAssetDocument = async (
    req,
    res
) => {

    try {

        const document =
            await assetDocumentService.updateAssetDocument(
                req.params.id,
                req.body
            );


        return res.status(200).json({

            success: true,

            message:
                "Asset document updated successfully",

            data:
                document
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

const activateAssetDocument = async (
    req,
    res
) => {

    try {

        const document =
            await assetDocumentService.activateAssetDocument(
                req.params.id
            );


        return res.status(200).json({

            success: true,

            message:
                "Asset document activated successfully",

            data:
                document
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

const deactivateAssetDocument = async (
    req,
    res
) => {

    try {

        const document =
            await assetDocumentService.deactivateAssetDocument(
                req.params.id
            );


        return res.status(200).json({

            success: true,

            message:
                "Asset document deactivated successfully",

            data:
                document
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
// UPDATE EXPIRED
// ======================================================

const updateExpiredDocuments = async (
    req,
    res
) => {

    try {

        const result =
            await assetDocumentService.updateExpiredDocuments();


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


// ======================================================
// DELETE
// ======================================================

const deleteAssetDocument = async (
    req,
    res
) => {

    try {

        const result =
            await assetDocumentService.deleteAssetDocument(
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

    createAssetDocument,

    getAllAssetDocuments,

    getAssetDocumentById,

    getAssetDocumentsByAssetId,

    getWarrantyDocuments,

    updateAssetDocument,

    activateAssetDocument,

    deactivateAssetDocument,

    updateExpiredDocuments,

    deleteAssetDocument
};

