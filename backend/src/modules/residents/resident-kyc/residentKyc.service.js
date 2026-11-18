const repository = require("./residentKyc.repository");
const storage = require("./residentKyc.storage");

const createDocument = async (data, file, uploadedBy) => {
    if (!file) {
        return repository.create({
            societyId: data.societyId,
            stakeholderId: data.stakeholderId,
            documentType: data.documentType,
            documentName: data.documentName,
            documentNumber: data.documentNumber || null,
            fileName: data.fileName || null,
            fileUrl: data.fileUrl || null,
            storageKey: data.storageKey || null,
            mimeType: data.mimeType || null,
            fileSize: data.fileSize || null,
            checksum: data.checksum || null,
            isEncrypted: data.isEncrypted !== undefined ? data.isEncrypted : true,
            issuedDate: data.issuedDate || null,
            expiryDate: data.expiryDate || null,
            verificationStatus: "PENDING",
            accessLevel: data.accessLevel || "ADMIN_ONLY",
            uploadedBy: data.uploadedBy || uploadedBy || null,
            remarks: data.remarks || null
        });
    }
    const fileChecksum = storage.checksum(file.buffer);
    const storageKey = storage.save(file);
    try {
        return await repository.create({
        societyId: data.societyId,
        stakeholderId: data.stakeholderId,

        documentType: data.documentType,
        documentName: data.documentName,
        documentNumber: data.documentNumber || null,

        fileName: file.originalname,
        fileUrl: null,
        storageKey,

        mimeType: file.mimetype,
        fileSize: file.size,
        checksum: fileChecksum,

        isEncrypted: false,

        issuedDate: data.issuedDate || null,
        expiryDate: data.expiryDate || null,

        verificationStatus: "PENDING",

        accessLevel:
            data.accessLevel || "ADMIN_ONLY",

        uploadedBy: uploadedBy || null,

        remarks: data.remarks || null
        });
    } catch (error) {
        storage.remove(storageKey);
        throw error;
    }
};

const getDocumentFile = async (id, societyId) => {
    const document = await repository.findById(id);
    if (!document || !document.isActive) throw new Error("Resident document not found");
    if (societyId && document.societyId !== societyId) throw new Error("Resident document not found");
    if (!document.storageKey) throw new Error("Resident document file is unavailable");
    const fullPath = storage.getPath(document.storageKey);
    if (!require("fs").existsSync(fullPath)) throw new Error("Resident document file is unavailable");
    return { document, fullPath };
};


const getDocument = async (id) => {
    const document = await repository.findById(id);

    if (!document) {
        throw new Error("KYC document not found");
    }

    return document;
};


const getStakeholderDocuments = async (stakeholderId, societyId) => {
    return await repository.findByStakeholder(stakeholderId, societyId);
};


const getSocietyDocuments = async (societyId) => {
    return await repository.findBySociety(societyId);
};


const getPendingDocuments = async (societyId) => {
    return await repository.findPending(societyId);
};


const updateDocument = async (id, data) => {
    const document = await repository.findById(id);

    if (!document) {
        throw new Error("KYC document not found");
    }

    return await repository.update(document, data);
};


const verifyDocument = async (
    id,
    verifiedBy,
    remarks
) => {
    const document = await repository.findById(id);

    if (!document) {
        throw new Error("KYC document not found");
    }

    return await repository.update(document, {
        verificationStatus: "VERIFIED",
        verifiedBy,
        verifiedAt: new Date(),
        verificationRemarks: remarks || null
    });
};


const rejectDocument = async (
    id,
    verifiedBy,
    remarks
) => {
    const document = await repository.findById(id);

    if (!document) {
        throw new Error("KYC document not found");
    }

    return await repository.update(document, {
        verificationStatus: "REJECTED",
        verifiedBy,
        verifiedAt: new Date(),
        verificationRemarks: remarks || null
    });
};


const requestMoreInformation = async (
    id,
    verifiedBy,
    remarks
) => {
    const document = await repository.findById(id);

    if (!document) {
        throw new Error("KYC document not found");
    }

    return await repository.update(document, {
        verificationStatus: "PENDING",
        verifiedBy,
        verifiedAt: new Date(),
        verificationRemarks: remarks || "More information required"
    });
};


const archiveDocument = async (id) => {
    const document = await repository.findById(id);

    if (!document) {
        throw new Error("KYC document not found");
    }

    return await repository.update(document, {
        isActive: false,
        archivedAt: new Date()
    });
};


const getExpiringDocuments = async (
    societyId,
    startDate,
    endDate
) => {
    return await repository.findExpiring(
        societyId,
        startDate,
        endDate
    );
};


module.exports = {
    createDocument,
    getDocumentFile,
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
