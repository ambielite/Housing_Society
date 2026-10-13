const service = require("./residentKyc.service");


const createDocument = async (req, res) => {
    try {
        const document = await service.createDocument(req.body);

        return res.status(201).json({
            success: true,
            message: "KYC document created successfully",
            data: document
        });

    } catch (error) {
        console.error("Create KYC error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getDocument = async (req, res) => {
    try {
        const document = await service.getDocument(req.params.id);

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


const getStakeholderDocuments = async (req, res) => {
    try {
        const documents =
            await service.getStakeholderDocuments(
                req.params.stakeholderId
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


const getSocietyDocuments = async (req, res) => {
    try {
        const documents =
            await service.getSocietyDocuments(
                req.params.societyId
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


const getPendingDocuments = async (req, res) => {
    try {
        const documents =
            await service.getPendingDocuments(
                req.params.societyId
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


const updateDocument = async (req, res) => {
    try {
        const document =
            await service.updateDocument(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message: "KYC document updated successfully",
            data: document
        });

    } catch (error) {
        return res.status(404).json({
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

        return res.status(200).json({
            success: true,
            message: "KYC document verified successfully",
            data: document
        });

    } catch (error) {
        return res.status(404).json({
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

        return res.status(200).json({
            success: true,
            message: "KYC document rejected",
            data: document
        });

    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const requestMoreInformation = async (req, res) => {
    try {
        const document =
            await service.requestMoreInformation(
                req.params.id,
                req.body.verifiedBy,
                req.body.remarks
            );

        return res.status(200).json({
            success: true,
            message: "More information requested",
            data: document
        });

    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const archiveDocument = async (req, res) => {
    try {
        const document =
            await service.archiveDocument(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: "KYC document archived successfully",
            data: document
        });

    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const getExpiringDocuments = async (req, res) => {
    try {
        const {
            societyId,
            startDate,
            endDate
        } = req.query;

        if (!societyId || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message:
                    "societyId, startDate and endDate are required"
            });
        }

        const documents =
            await service.getExpiringDocuments(
                societyId,
                startDate,
                endDate
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


module.exports = {
    createDocument,
    getDocument,
    getStakeholderDocuments,
    getSocietyDocuments,
    getPendingDocuments,
    updateDocument,
    verifyDocument,
    rejectDocument,
    requestMoreInformation,
    archiveDocument,
    getExpiringDocuments
};