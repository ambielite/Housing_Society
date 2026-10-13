const repository = require("./kycDocument.repository");

const {
    validateCreateKycDocument,
    validateUpdateKycDocument
} = require("./kycDocument.validation");

const Society = require("../../../modules/societies/society/society.model");

// Change this path if your 8.1 stakeholder model has a different name/path.
const Stakeholder = require("../resident/resident.model");


// ============================================================
// CREATE
// ============================================================

const createDocument = async (data) => {

    const errors =
        validateCreateKycDocument(data);

    if (errors.length > 0) {
        throw new Error(errors.join(", "));
    }


    // Society validation
    const society =
        await Society.findByPk(data.societyId);

    if (!society) {
        throw new Error("Society not found");
    }


    // Stakeholder validation
    const stakeholder =
        await Stakeholder.findByPk(
            data.stakeholderId
        );

    if (!stakeholder) {
        throw new Error("Stakeholder not found");
    }


    // Make sure stakeholder belongs to same society
    if (
        stakeholder.societyId &&
        stakeholder.societyId !== data.societyId
    ) {
        throw new Error(
            "Stakeholder does not belong to this society"
        );
    }


    return await repository.create(data);
};


// ============================================================
// GET ALL
// ============================================================

const getAllDocuments = async (filters = {}) => {

    const where = {
        isArchived: false
    };


    if (filters.societyId) {
        where.societyId =
            filters.societyId;
    }


    if (filters.stakeholderId) {
        where.stakeholderId =
            filters.stakeholderId;
    }


    if (filters.documentType) {
        where.documentType =
            filters.documentType;
    }


    if (filters.verificationStatus) {
        where.verificationStatus =
            filters.verificationStatus;
    }


    return await repository.findAll(where);
};


// ============================================================
// GET BY ID
// ============================================================

const getDocumentById = async (id) => {

    const document =
        await repository.findById(id);

    if (!document) {
        throw new Error(
            "KYC document not found"
        );
    }

    return document;
};


// ============================================================
// GET BY STAKEHOLDER
// ============================================================

const getDocumentsByStakeholder = async (
    societyId,
    stakeholderId
) => {

    return await repository.findByStakeholder(
        societyId,
        stakeholderId
    );
};


// ============================================================
// PENDING VERIFICATION
// ============================================================

const getPendingDocuments = async (
    societyId
) => {

    return await repository.findPending(
        societyId
    );
};


// ============================================================
// UPDATE
// ============================================================

const updateDocument = async (
    id,
    data
) => {

    const document =
        await repository.findById(id);

    if (!document) {
        throw new Error(
            "KYC document not found"
        );
    }


    if (document.isArchived) {
        throw new Error(
            "Archived document cannot be updated"
        );
    }


    const errors =
        validateUpdateKycDocument(data);

    if (errors.length > 0) {
        throw new Error(
            errors.join(", ")
        );
    }


    // Don't allow society change
    if (data.societyId) {
        delete data.societyId;
    }


    return await repository.update(
        document,
        data
    );
};


// ============================================================
// APPROVE
// ============================================================

const approveDocument = async (
    id,
    verifiedBy,
    remarks
) => {

    const document =
        await repository.findById(id);

    if (!document) {
        throw new Error(
            "KYC document not found"
        );
    }


    if (document.isArchived) {
        throw new Error(
            "Archived document cannot be approved"
        );
    }


    await repository.update(
        document,
        {
            verificationStatus: "APPROVED",

            verifiedBy,

            verifiedAt: new Date(),

            verificationRemarks:
                remarks || null
        }
    );


    return document;
};


// ============================================================
// REJECT
// ============================================================

const rejectDocument = async (
    id,
    verifiedBy,
    remarks
) => {

    const document =
        await repository.findById(id);

    if (!document) {
        throw new Error(
            "KYC document not found"
        );
    }


    if (document.isArchived) {
        throw new Error(
            "Archived document cannot be rejected"
        );
    }


    await repository.update(
        document,
        {
            verificationStatus: "REJECTED",

            verifiedBy,

            verifiedAt: new Date(),

            verificationRemarks:
                remarks || null
        }
    );


    return document;
};


// ============================================================
// REQUEST MORE INFORMATION
// ============================================================

const requestMoreInformation = async (
    id,
    verifiedBy,
    remarks
) => {

    const document =
        await repository.findById(id);

    if (!document) {
        throw new Error(
            "KYC document not found"
        );
    }


    if (document.isArchived) {
        throw new Error(
            "Archived document cannot be updated"
        );
    }


    if (!remarks) {
        throw new Error(
            "Remarks are required when requesting more information"
        );
    }


    await repository.update(
        document,
        {
            verificationStatus:
                "REQUEST_MORE_INFORMATION",

            verifiedBy,

            verifiedAt: new Date(),

            verificationRemarks:
                remarks
        }
    );


    return document;
};


// ============================================================
// ARCHIVE
// ============================================================

const archiveDocument = async (
    id,
    archivedBy
) => {

    const document =
        await repository.findById(id);

    if (!document) {
        throw new Error(
            "KYC document not found"
        );
    }


    if (document.isArchived) {
        throw new Error(
            "Document is already archived"
        );
    }


    return await repository.archive(
        document,
        archivedBy
    );
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