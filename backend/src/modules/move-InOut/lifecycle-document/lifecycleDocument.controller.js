const service = require("./lifecycleDocument.service");

const createDocument = async (req, res) => {
    try {
        const document =
            await service.createDocument(req.body);

        res.status(201).json({
            success: true,
            message: "Lifecycle document uploaded successfully",
            data: document
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getDocuments = async (req, res) => {
    try {
        const documents =
            await service.getDocuments();

        res.status(200).json({
            success: true,
            data: documents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getDocument = async (req, res) => {
    try {
        const document =
            await service.getDocument(req.params.id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        res.status(200).json({
            success: true,
            data: document
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getDocumentsByLifecycle = async (
    req,
    res
) => {
    try {
        const documents =
            await service.getDocumentsByLifecycle(
                req.params.lifecycleType,
                req.params.lifecycleId
            );

        res.status(200).json({
            success: true,
            data: documents
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getPendingDocuments = async (
    req,
    res
) => {
    try {
        const documents =
            await service.getPendingDocuments();

        res.status(200).json({
            success: true,
            data: documents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const verifyDocument = async (req, res) => {
    try {
        const document =
            await service.verifyDocument(
                req.params.id,
                req.body.verifiedBy,
                req.body.remarks
            );

        res.status(200).json({
            success: true,
            message: "Document verified successfully",
            data: document
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const rejectDocument = async (req, res) => {
    try {
        const document =
            await service.rejectDocument(
                req.params.id,
                req.body.verifiedBy,
                req.body.remarks
            );

        res.status(200).json({
            success: true,
            message: "Document rejected successfully",
            data: document
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const deleteDocument = async (req, res) => {
    try {
        const document =
            await service.deleteDocument(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Document deleted successfully",
            data: document
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createDocument,
    getDocuments,
    getDocument,
    getDocumentsByLifecycle,
    getPendingDocuments,
    verifyDocument,
    rejectDocument,
    deleteDocument
};