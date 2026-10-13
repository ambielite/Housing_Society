const service = require("./kycDocument.service");


// CREATE
const createDocument = async (req, res) => {

    try {

        const document =
            await service.createDocument(
                req.body
            );

        res.status(201).json({

            success: true,

            message:
                "KYC document created successfully",

            data: document

        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message: error.message

        });
    }
};


// GET ALL
const getAllDocuments = async (req, res) => {

    try {

        const documents =
            await service.getAllDocuments(
                req.query
            );

        res.status(200).json({

            success: true,

            count: documents.length,

            data: documents

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });
    }
};


// GET BY ID
const getDocumentById = async (req, res) => {

    try {

        const document =
            await service.getDocumentById(
                req.params.id
            );

        res.status(200).json({

            success: true,

            data: document

        });

    } catch (error) {

        res.status(404).json({

            success: false,

            message: error.message

        });
    }
};


// GET BY STAKEHOLDER
const getDocumentsByStakeholder = async (
    req,
    res
) => {

    try {

        const documents =
            await service.getDocumentsByStakeholder(

                req.query.societyId,

                req.params.stakeholderId

            );

        res.status(200).json({

            success: true,

            count: documents.length,

            data: documents

        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message: error.message

        });
    }
};


// PENDING
const getPendingDocuments = async (
    req,
    res
) => {

    try {

        const documents =
            await service.getPendingDocuments(
                req.query.societyId
            );

        res.status(200).json({

            success: true,

            count: documents.length,

            data: documents

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });
    }
};


// UPDATE
const updateDocument = async (
    req,
    res
) => {

    try {

        const document =
            await service.updateDocument(

                req.params.id,

                req.body

            );

        res.status(200).json({

            success: true,

            message:
                "KYC document updated successfully",

            data: document

        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message: error.message

        });
    }
};


// APPROVE
const approveDocument = async (
    req,
    res
) => {

    try {

        const document =
            await service.approveDocument(

                req.params.id,

                req.body.verifiedBy,

                req.body.remarks

            );

        res.status(200).json({

            success: true,

            message:
                "KYC document approved successfully",

            data: document

        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message: error.message

        });
    }
};


// REJECT
const rejectDocument = async (
    req,
    res
) => {

    try {

        const document =
            await service.rejectDocument(

                req.params.id,

                req.body.verifiedBy,

                req.body.remarks

            );

        res.status(200).json({

            success: true,

            message:
                "KYC document rejected successfully",

            data: document

        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message: error.message

        });
    }
};


// REQUEST MORE INFORMATION
const requestMoreInformation = async (
    req,
    res
) => {

    try {

        const document =
            await service.requestMoreInformation(

                req.params.id,

                req.body.verifiedBy,

                req.body.remarks

            );

        res.status(200).json({

            success: true,

            message:
                "More information requested successfully",

            data: document

        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message: error.message

        });
    }
};


// ARCHIVE
const archiveDocument = async (
    req,
    res
) => {

    try {

        const document =
            await service.archiveDocument(

                req.params.id,

                req.body.archivedBy

            );

        res.status(200).json({

            success: true,

            message:
                "KYC document archived successfully",

            data: document

        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message: error.message

        });
    }
};


module.exports = {

    createDocument,
    getAllDocuments,
    getDocumentById,
    getDocumentsByStakeholder,
    getPendingDocuments,
    updateDocument,
    approveDocument,
    rejectDocument,
    requestMoreInformation,
    archiveDocument

};