const StaffDocumentService =
    require("./staffDocument.service");


const createDocument = async (req, res) => {

    try {

        const document =
            await StaffDocumentService.createDocument(
                req.body,
                req.file
            );

        return res.status(201).json({
            success: true,
            message:
                "Staff document created successfully",
            data: document
        });

    } catch (error) {

        console.error(
            "Create staff document error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAllDocuments = async (req, res) => {

    try {

        const filters = {};

        if (req.query.staffId) {
            filters.staffId =
                req.query.staffId;
        }

        if (req.query.documentType) {
            filters.documentType =
                req.query.documentType;
        }

        if (req.query.verificationStatus) {
            filters.verificationStatus =
                req.query.verificationStatus;
        }

        const documents =
            await StaffDocumentService.getAllDocuments(
                filters
            );

        return res.status(200).json({
            success: true,
            count: documents.length,
            data: documents
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getDocumentById = async (req, res) => {

    try {

        const document =
            await StaffDocumentService.getDocumentById(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            data: document
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const getDocumentsByStaff = async (req, res) => {

    try {

        const documents =
            await StaffDocumentService.getDocumentsByStaff(
                req.params.staffId
            );

        return res.status(200).json({
            success: true,
            count: documents.length,
            data: documents
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const updateDocument = async (req, res) => {

    try {

        const document =
            await StaffDocumentService.updateDocument(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message:
                "Staff document updated successfully",
            data: document
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const verifyDocument = async (req, res) => {

    try {

        const document =
            await StaffDocumentService.verifyDocument(
                req.params.id,
                req.body?.verifiedBy || req.user?.id || null
            );

        return res.status(200).json({
            success: true,
            message:
                "Staff document verified successfully",
            data: document
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const rejectDocument = async (req, res) => {

    try {

        const document =
            await StaffDocumentService.rejectDocument(
                req.params.id,
                req.body.remarks
            );

        return res.status(200).json({
            success: true,
            message:
                "Staff document rejected",
            data: document
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteDocument = async (req, res) => {

    try {

        const result =
            await StaffDocumentService.deleteDocument(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createDocument,
    getAllDocuments,
    getDocumentById,
    getDocumentsByStaff,
    updateDocument,
    verifyDocument,
    rejectDocument,
    deleteDocument
};
