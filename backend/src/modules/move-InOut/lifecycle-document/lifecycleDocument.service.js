const repository = require("./lifecycleDocument.repository");

const createDocument = async (data) => {
    return await repository.create({
        lifecycleType: data.lifecycleType,
        lifecycleId: data.lifecycleId,
        documentType: data.documentType,
        documentName: data.documentName,
        documentUrl: data.documentUrl || null,
        uploadedBy: data.uploadedBy || null,
        status: "PENDING_VERIFICATION",
        remarks: data.remarks || null
    });
};

const getDocuments = async () => {
    return await repository.findAll();
};

const getDocument = async (id) => {
    return await repository.findById(id);
};

const getDocumentsByLifecycle = async (
    lifecycleType,
    lifecycleId
) => {
    return await repository.findByLifecycle(
        lifecycleType,
        lifecycleId
    );
};

const getPendingDocuments = async () => {
    return await repository.findPending();
};

const verifyDocument = async (
    id,
    verifiedBy,
    remarks
) => {
    const document =
        await repository.findById(id);

    if (!document) {
        throw new Error("Document not found");
    }

    if (
        document.status !==
        "PENDING_VERIFICATION"
    ) {
        throw new Error(
            "Only pending documents can be verified"
        );
    }

    return await repository.update(id, {
        status: "VERIFIED",
        verifiedBy,
        verifiedAt: new Date(),
        remarks: remarks || null
    });
};

const rejectDocument = async (
    id,
    verifiedBy,
    remarks
) => {
    const document =
        await repository.findById(id);

    if (!document) {
        throw new Error("Document not found");
    }

    if (
        document.status !==
        "PENDING_VERIFICATION"
    ) {
        throw new Error(
            "Only pending documents can be rejected"
        );
    }

    if (!remarks) {
        throw new Error(
            "Remarks are required when rejecting a document"
        );
    }

    return await repository.update(id, {
        status: "REJECTED",
        verifiedBy,
        verifiedAt: new Date(),
        remarks
    });
};

const deleteDocument = async (id) => {
    const document =
        await repository.deleteById(id);

    if (!document) {
        throw new Error("Document not found");
    }

    return document;
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