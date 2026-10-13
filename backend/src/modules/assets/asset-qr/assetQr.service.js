
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");

const assetQrRepository =
    require("./assetQr.repository");

const {
    validateCreateAssetQr,
    validateUpdateAssetQr
} = require("./assetQr.validation");

const Asset =
    require("../asset/asset.model");


// ======================================================
// QR DIRECTORY
// ======================================================

const qrDirectory = path.join(
    process.cwd(),
    "uploads",
    "asset-qr"
);


// ======================================================
// CREATE QR DIRECTORY
// ======================================================

const ensureQrDirectory = () => {

    if (!fs.existsSync(qrDirectory)) {

        fs.mkdirSync(
            qrDirectory,
            {
                recursive: true
            }
        );
    }
};


// ======================================================
// GENERATE UNIQUE QR CODE
// ======================================================

const generateQrCode = () => {

    const randomPart =
        Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase();

    return `AST-QR-${Date.now()}-${randomPart}`;
};


// ======================================================
// CREATE QR VALUE
// ======================================================

const createQrValue = (
    asset,
    qrCode
) => {

    return JSON.stringify({
        type: "ASSET",

        assetId: asset.id,

        assetCode: asset.assetCode,

        assetName: asset.assetName,

        qrCode: qrCode
    });
};


// ======================================================
// GENERATE QR IMAGE
// ======================================================

const generateQrImage = async (
    qrCode,
    qrValue
) => {

    ensureQrDirectory();


    const fileName =
        `${qrCode}.png`;


    const filePath =
        path.join(
            qrDirectory,
            fileName
        );


    await QRCode.toFile(
        filePath,
        qrValue,
        {
            width: 500,

            margin: 2,

            errorCorrectionLevel: "H"
        }
    );


    return {
        fileName,

        filePath,

        relativePath:
            `/uploads/asset-qr/${fileName}`
    };
};


// ======================================================
// DELETE QR IMAGE
// ======================================================

const deleteQrImage = (
    qrImagePath
) => {

    if (!qrImagePath) {
        return;
    }


    const fileName =
        path.basename(qrImagePath);


    const filePath =
        path.join(
            qrDirectory,
            fileName
        );


    if (fs.existsSync(filePath)) {

        fs.unlinkSync(filePath);
    }
};


// ======================================================
// CREATE ASSET QR
// ======================================================

const createAssetQr = async (data) => {

    const errors =
        validateCreateAssetQr(data);


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
    // CHECK EXISTING QR
    // --------------------------------------------------

    const existingQr =
        await assetQrRepository.findByAssetId(
            data.assetId
        );


    if (existingQr) {

        throw new Error(
            "QR tag already exists for this asset"
        );
    }


    // --------------------------------------------------
    // GENERATE UNIQUE CODE
    // --------------------------------------------------

    let qrCode;

    let existingCode;


    do {

        qrCode =
            generateQrCode();


        existingCode =
            await assetQrRepository.findByQrCode(
                qrCode
            );

    } while (existingCode);


    // --------------------------------------------------
    // CREATE QR VALUE
    // --------------------------------------------------

    const qrValue =
        createQrValue(
            asset,
            qrCode
        );


    // --------------------------------------------------
    // GENERATE IMAGE
    // --------------------------------------------------

    const qrImage =
        await generateQrImage(
            qrCode,
            qrValue
        );


    try {

        // --------------------------------------------------
        // SAVE DATABASE RECORD
        // --------------------------------------------------

        const qrTag =
            await assetQrRepository.create({

                assetId:
                    asset.id,

                qrCode:
                    qrCode,

                qrValue:
                    qrValue,

                qrImagePath:
                    qrImage.relativePath,

                generatedAt:
                    new Date(),

                status:
                    data.status ||
                    "ACTIVE",

                remarks:
                    data.remarks ||
                    null
            });


        return qrTag;

    } catch (error) {

        // If DB creation fails,
        // remove generated image

        deleteQrImage(
            qrImage.relativePath
        );

        throw error;
    }
};


// ======================================================
// GET ALL QR TAGS
// ======================================================

const getAllAssetQr = async (
    filters = {}
) => {

    const where = {};


    if (filters.status) {

        where.status =
            filters.status;
    }


    if (filters.assetId) {

        where.assetId =
            filters.assetId;
    }


    return await assetQrRepository.findAll(
        where
    );
};


// ======================================================
// GET QR BY ID
// ======================================================

const getAssetQrById = async (id) => {

    const qrTag =
        await assetQrRepository.findById(
            id
        );


    if (!qrTag) {

        throw new Error(
            "Asset QR tag not found"
        );
    }


    return qrTag;
};


// ======================================================
// GET QR BY ASSET ID
// ======================================================

const getAssetQrByAssetId = async (
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


    const qrTag =
        await assetQrRepository.findByAssetId(
            assetId
        );


    if (!qrTag) {

        throw new Error(
            "QR tag not found for this asset"
        );
    }


    return qrTag;
};


// ======================================================
// GET QR BY QR CODE
// ======================================================

const getAssetQrByCode = async (
    qrCode
) => {

    const qrTag =
        await assetQrRepository.findByQrCode(
            qrCode
        );


    if (!qrTag) {

        throw new Error(
            "QR code not found"
        );
    }


    return qrTag;
};


// ======================================================
// SCAN QR VALUE
// ======================================================

const scanAssetQr = async (
    qrValue
) => {

    if (!qrValue) {

        throw new Error(
            "QR value is required"
        );
    }


    let qrData;


    try {

        qrData =
            JSON.parse(qrValue);

    } catch (error) {

        throw new Error(
            "Invalid QR value"
        );
    }


    if (
        !qrData.assetId ||
        !qrData.qrCode
    ) {

        throw new Error(
            "Invalid asset QR data"
        );
    }


    const qrTag =
        await assetQrRepository.findByQrCode(
            qrData.qrCode
        );


    if (!qrTag) {

        throw new Error(
            "QR tag not found"
        );
    }


    if (qrTag.status !== "ACTIVE") {

        throw new Error(
            "QR tag is inactive"
        );
    }


    if (
        qrTag.assetId !==
        qrData.assetId
    ) {

        throw new Error(
            "QR data does not match asset"
        );
    }


    const asset =
        await Asset.findByPk(
            qrTag.assetId
        );


    if (!asset) {

        throw new Error(
            "Asset not found"
        );
    }


    return {

        qrTag,

        asset
    };
};


// ======================================================
// UPDATE QR TAG
// ======================================================

const updateAssetQr = async (
    id,
    data
) => {

    const qrTag =
        await assetQrRepository.findById(
            id
        );


    if (!qrTag) {

        throw new Error(
            "Asset QR tag not found"
        );
    }


    const errors =
        validateUpdateAssetQr(data);


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
    // DON'T ALLOW QR CODE CHANGE
    // --------------------------------------------------

    if (data.qrCode) {

        delete data.qrCode;
    }


    // --------------------------------------------------
    // DON'T ALLOW QR VALUE CHANGE
    // --------------------------------------------------

    if (data.qrValue) {

        delete data.qrValue;
    }


    // --------------------------------------------------
    // DON'T ALLOW IMAGE PATH CHANGE
    // --------------------------------------------------

    if (data.qrImagePath) {

        delete data.qrImagePath;
    }


    return await assetQrRepository.update(
        qrTag,
        data
    );
};


// ======================================================
// ACTIVATE QR
// ======================================================

const activateAssetQr = async (
    id
) => {

    const qrTag =
        await assetQrRepository.findById(
            id
        );


    if (!qrTag) {

        throw new Error(
            "Asset QR tag not found"
        );
    }


    const asset =
        await Asset.findByPk(
            qrTag.assetId
        );


    if (!asset) {

        throw new Error(
            "Asset not found"
        );
    }


    if (asset.status === "DISPOSED") {

        throw new Error(
            "QR tag for disposed asset cannot be activated"
        );
    }


    await assetQrRepository.update(
        qrTag,
        {
            status: "ACTIVE"
        }
    );


    return qrTag;
};


// ======================================================
// DEACTIVATE QR
// ======================================================

const deactivateAssetQr = async (
    id
) => {

    const qrTag =
        await assetQrRepository.findById(
            id
        );


    if (!qrTag) {

        throw new Error(
            "Asset QR tag not found"
        );
    }


    await assetQrRepository.update(
        qrTag,
        {
            status: "INACTIVE"
        }
    );


    return qrTag;
};


// ======================================================
// REGENERATE QR
// ======================================================

const regenerateAssetQr = async (
    id
) => {

    const qrTag =
        await assetQrRepository.findById(
            id
        );


    if (!qrTag) {

        throw new Error(
            "Asset QR tag not found"
        );
    }


    const asset =
        await Asset.findByPk(
            qrTag.assetId
        );


    if (!asset) {

        throw new Error(
            "Asset not found"
        );
    }


    if (asset.status === "DISPOSED") {

        throw new Error(
            "QR cannot be regenerated for disposed asset"
        );
    }


    // --------------------------------------------------
    // GENERATE NEW QR CODE
    // --------------------------------------------------

    let newQrCode;

    let existingCode;


    do {

        newQrCode =
            generateQrCode();


        existingCode =
            await assetQrRepository.findByQrCode(
                newQrCode
            );

    } while (existingCode);


    const newQrValue =
        createQrValue(
            asset,
            newQrCode
        );


    // --------------------------------------------------
    // GENERATE NEW IMAGE
    // --------------------------------------------------

    const newQrImage =
        await generateQrImage(
            newQrCode,
            newQrValue
        );


    const oldQrImage =
        qrTag.qrImagePath;


    try {

        await assetQrRepository.update(
            qrTag,
            {
                qrCode:
                    newQrCode,

                qrValue:
                    newQrValue,

                qrImagePath:
                    newQrImage.relativePath,

                generatedAt:
                    new Date(),

                status:
                    "ACTIVE"
            }
        );


        // Delete old image after
        // successful database update

        deleteQrImage(
            oldQrImage
        );


        return qrTag;

    } catch (error) {

        deleteQrImage(
            newQrImage.relativePath
        );

        throw error;
    }
};


// ======================================================
// DELETE QR
// ======================================================

const deleteAssetQr = async (
    id
) => {

    const qrTag =
        await assetQrRepository.findById(
            id
        );


    if (!qrTag) {

        throw new Error(
            "Asset QR tag not found"
        );
    }


    if (qrTag.status === "ACTIVE") {

        throw new Error(
            "Active QR tag cannot be deleted. Deactivate it first."
        );
    }


    const oldQrImage =
        qrTag.qrImagePath;


    await assetQrRepository.deleteQr(
        qrTag
    );


    deleteQrImage(
        oldQrImage
    );


    return {

        message:
            "Asset QR tag deleted successfully"
    };
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

