
const path = require("path");
const fs = require("fs");

const assetDocumentRepository =
    require("./assetDocument.repository");

const {
    validateCreateAssetDocument,
    validateUpdateAssetDocument
} = require("./assetDocument.validation");

const Asset =
    require("../asset/asset.model");


// ======================================================
// DOCUMENT DIRECTORY
// ======================================================

const documentDirectory = path.join(
    process.cwd(),
    "uploads",
    "asset-documents"
);


// ======================================================
// CREATE DIRECTORY
// ======================================================

const ensureDocumentDirectory = () => {

    if (
        !fs.existsSync(
            documentDirectory
        )
    ) {

        fs.mkdirSync(
            documentDirectory,
            {
                recursive: true
            }
        );
    }
};


// ======================================================
// DELETE FILE
// ======================================================

const deleteFile = (
    filePath
) => {

    if (!filePath) {
        return;
    }


    const fileName =
        path.basename(filePath);


    const fullPath =
        path.join(
            documentDirectory,
            fileName
        );


    if (
        fs.existsSync(fullPath)
    ) {

        fs.unlinkSync(
            fullPath
        );
    }
};


// ======================================================
// CREATE DOCUMENT
// ======================================================

const createAssetDocument = async (
    data,
    file = null
) => {

    const errors =
        validateCreateAssetDocument(
            data
        );


    if (errors.length > 0) {

        throw new Error(
            errors.join(", ")
        );
    }


    // --------------------------------------------------
    // CHECK ASSET
    // --------------------------------------------------

    const asset =
        await Asset.findByPk(
            data.assetId
        );


    if (!asset) {

        throw new Error(
            "Asset not found"
        );
    }


    // --------------------------------------------------
    // WARRANTY DATE VALIDATION
    // --------------------------------------------------

    if (
        data.warrantyStartDate &&
        data.warrantyEndDate
    ) {

        const start =
            new Date(
                data.warrantyStartDate
            );

        const end =
            new Date(
                data.warrantyEndDate
            );


        if (end < start) {

            throw new Error(
                "Warranty end date cannot be before warranty start date"
            );
        }
    }


    // --------------------------------------------------
    // EXPIRY DATE VALIDATION
    // --------------------------------------------------

    if (
        data.issueDate &&
        data.expiryDate
    ) {

        const issue =
            new Date(
                data.issueDate
            );

        const expiry =
            new Date(
                data.expiryDate
            );


        if (expiry < issue) {

            throw new Error(
                "Expiry date cannot be before issue date"
            );
        }
    }


    // --------------------------------------------------
    // WARRANTY DOCUMENT
    // --------------------------------------------------

    if (
        data.documentType ===
        "WARRANTY_CERTIFICATE"
    ) {

        if (
            !data.warrantyStartDate ||
            !data.warrantyEndDate
        ) {

            throw new Error(
                "Warranty start date and warranty end date are required for warranty certificate"
            );
        }
    }


    // --------------------------------------------------
    // FILE
    // --------------------------------------------------

    let fileData = {};


    if (file) {

        ensureDocumentDirectory();


        const originalName =
            file.originalname;


        const extension =
            path.extname(
                originalName
            );


        const uniqueName =
            `asset-document-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 8)}${extension}`;


        const destination =
            path.join(
                documentDirectory,
                uniqueName
            );


        // Multer normally provides
        // file.buffer for memory storage

        if (file.buffer) {

            fs.writeFileSync(
                destination,
                file.buffer
            );

        } else if (file.path) {

            fs.copyFileSync(
                file.path,
                destination
            );
        }


        fileData = {

            fileName:
                originalName,

            filePath:
                `/uploads/asset-documents/${uniqueName}`,

            fileType:
                file.mimetype,

            fileSize:
                file.size
        };
    }


    try {

        // --------------------------------------------------
        // CREATE DATABASE RECORD
        // --------------------------------------------------

        const document =
            await assetDocumentRepository.create({

                assetId:
                    data.assetId,

                documentType:
                    data.documentType,

                documentName:
                    data.documentName,

                documentNumber:
                    data.documentNumber ||
                    null,

                fileName:
                    fileData.fileName ||
                    data.fileName ||
                    null,

                filePath:
                    fileData.filePath ||
                    data.filePath ||
                    null,

                fileType:
                    fileData.fileType ||
                    data.fileType ||
                    null,

                fileSize:
                    fileData.fileSize ||
                    data.fileSize ||
                    null,

                issueDate:
                    data.issueDate ||
                    null,

                expiryDate:
                    data.expiryDate ||
                    null,

                warrantyStartDate:
                    data.warrantyStartDate ||
                    null,

                warrantyEndDate:
                    data.warrantyEndDate ||
                    null,

                warrantyProvider:
                    data.warrantyProvider ||
                    null,

                warrantyRemarks:
                    data.warrantyRemarks ||
                    null,

                status:
                    data.status ||
                    "ACTIVE",

                remarks:
                    data.remarks ||
                    null
            });


        return document;

    } catch (error) {

        if (fileData.filePath) {

            deleteFile(
                fileData.filePath
            );
        }


        throw error;
    }
};


// ======================================================
// GET ALL
// ======================================================

const getAllAssetDocuments = async (
    filters = {}
) => {

    const where = {};


    if (filters.assetId) {

        where.assetId =
            filters.assetId;
    }


    if (filters.documentType) {

        where.documentType =
            filters.documentType;
    }


    if (filters.status) {

        where.status =
            filters.status;
    }


    return await assetDocumentRepository.findAll(
        where
    );
};


// ======================================================
// GET BY ID
// ======================================================

const getAssetDocumentById = async (
    id
) => {

    const document =
        await assetDocumentRepository.findById(
            id
        );


    if (!document) {

        throw new Error(
            "Asset document not found"
        );
    }


    return document;
};


// ======================================================
// GET BY ASSET
// ======================================================

const getAssetDocumentsByAssetId = async (
    assetId
) => {

    const asset =
        await Asset.findByPk(
            assetId
        );


    if (!asset) {

        throw new Error(
            "Asset not found"
        );
    }


    return await assetDocumentRepository.findByAssetId(
        assetId
    );
};


// ======================================================
// GET WARRANTY DOCUMENTS
// ======================================================

const getWarrantyDocuments = async (
    assetId
) => {

    const asset =
        await Asset.findByPk(
            assetId
        );


    if (!asset) {

        throw new Error(
            "Asset not found"
        );
    }


    return await assetDocumentRepository.findWarrantyDocuments(
        assetId
    );
};


// ======================================================
// UPDATE
// ======================================================

const updateAssetDocument = async (
    id,
    data
) => {

    const document =
        await assetDocumentRepository.findById(
            id
        );


    if (!document) {

        throw new Error(
            "Asset document not found"
        );
    }


    const errors =
        validateUpdateAssetDocument(
            data
        );


    if (errors.length > 0) {

        throw new Error(
            errors.join(", ")
        );
    }


    // --------------------------------------------------
    // DON'T ALLOW ASSET CHANGE
    // --------------------------------------------------

    if (data.assetId) {

        delete data.assetId;
    }


    // --------------------------------------------------
    // WARRANTY DATE CHECK
    // --------------------------------------------------

    const warrantyStart =
        data.warrantyStartDate ||
        document.warrantyStartDate;

    const warrantyEnd =
        data.warrantyEndDate ||
        document.warrantyEndDate;


    if (
        warrantyStart &&
        warrantyEnd
    ) {

        if (
            new Date(warrantyEnd) <
            new Date(warrantyStart)
        ) {

            throw new Error(
                "Warranty end date cannot be before warranty start date"
            );
        }
    }


    return await assetDocumentRepository.update(
        document,
        data
    );
};


// ======================================================
// ACTIVATE
// ======================================================

const activateAssetDocument = async (
    id
) => {

    const document =
        await assetDocumentRepository.findById(
            id
        );


    if (!document) {

        throw new Error(
            "Asset document not found"
        );
    }


    await assetDocumentRepository.update(
        document,
        {
            status: "ACTIVE"
        }
    );


    return document;
};


// ======================================================
// DEACTIVATE
// ======================================================

const deactivateAssetDocument = async (
    id
) => {

    const document =
        await assetDocumentRepository.findById(
            id
        );


    if (!document) {

        throw new Error(
            "Asset document not found"
        );
    }


    await assetDocumentRepository.update(
        document,
        {
            status: "INACTIVE"
        }
    );


    return document;
};


// ======================================================
// DELETE
// ======================================================

const deleteAssetDocument = async (
    id
) => {

    const document =
        await assetDocumentRepository.findById(
            id
        );


    if (!document) {

        throw new Error(
            "Asset document not found"
        );
    }


    if (
        document.status === "ACTIVE"
    ) {

        throw new Error(
            "Active document cannot be deleted. Deactivate it first."
        );
    }


    const filePath =
        document.filePath;


    await assetDocumentRepository.deleteDocument(
        document
    );


    deleteFile(
        filePath
    );


    return {

        message:
            "Asset document deleted successfully"
    };
};


// ======================================================
// UPDATE EXPIRED DOCUMENTS
// ======================================================

const updateExpiredDocuments = async () => {

    const documents =
        await assetDocumentRepository.findAll({

            status: "ACTIVE"
        });


    const today =
        new Date();


    let updatedCount = 0;


    for (
        const document of documents
    ) {

        let expired = false;


        if (
            document.expiryDate
        ) {

            if (
                new Date(
                    document.expiryDate
                ) < today
            ) {

                expired = true;
            }
        }


        if (
            document.warrantyEndDate
        ) {

            if (
                new Date(
                    document.warrantyEndDate
                ) < today
            ) {

                expired = true;
            }
        }


        if (expired) {

            await assetDocumentRepository.update(
                document,
                {
                    status: "EXPIRED"
                }
            );


            updatedCount++;
        }
    }


    return {

        message:
            "Expired documents updated successfully",

        updatedCount
    };
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

    deleteAssetDocument,

    updateExpiredDocuments
};

