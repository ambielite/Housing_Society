const StaffDocumentRepository =
    require("./staffDocument.repository");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const Staff =
    require("../staff/staff.model");

const {
    validateCreateDocument,
    validateDocumentType
} = require("./staffDocument.validation");


const createDocument = async (data, file) => {

    const validationError =
        validateCreateDocument({
            ...data,
            documentPath: data.documentPath || (file ? "uploaded-file" : "")
        });

    if (validationError) {
        throw new Error(validationError);
    }

    const documentTypeError =
        validateDocumentType(
            data.documentType
        );

    if (documentTypeError) {
        throw new Error(documentTypeError);
    }

    const staff =
        await Staff.findByPk(data.staffId);

    if (!staff) {
        throw new Error(
            "Staff not found"
        );
    }

    if (
        data.issueDate &&
        data.expiryDate &&
        data.expiryDate < data.issueDate
    ) {
        throw new Error(
            "Expiry date cannot be before issue date"
        );
    }

    let documentPath = data.documentPath;
    let storedPath;

    if (file) {
        const directory = path.join(process.cwd(), "uploads", "staff-documents");
        fs.mkdirSync(directory, { recursive: true });
        const originalName = path.basename(file.originalname || "document").normalize("NFKD");
        const safeOriginalName = originalName.replace(/[^\w.-]+/g, "-").slice(-120) || "document";
        const fileName = `${crypto.randomUUID()}-${safeOriginalName}`;
        storedPath = path.join(directory, fileName);
        documentPath = `/uploads/staff-documents/${fileName}`;
        fs.writeFileSync(storedPath, file.buffer);
    }

    try {
        return await StaffDocumentRepository.create({ ...data, documentPath });
    } catch (error) {
        if (storedPath && fs.existsSync(storedPath)) fs.unlinkSync(storedPath);
        throw error;
    }
};


const getDocumentById = async (id) => {

    const document =
        await StaffDocumentRepository.findById(id);

    if (!document) {
        throw new Error(
            "Staff document not found"
        );
    }

    return document;
};


const getDocumentsByStaff = async (staffId) => {

    const staff =
        await Staff.findByPk(staffId);

    if (!staff) {
        throw new Error(
            "Staff not found"
        );
    }

    return await StaffDocumentRepository.findByStaffId(
        staffId
    );
};


const getAllDocuments = async (filters = {}) => {

    return await StaffDocumentRepository.findAll(
        filters
    );
};


const updateDocument = async (id, data) => {

    const document =
        await StaffDocumentRepository.findById(id);

    if (!document) {
        throw new Error(
            "Staff document not found"
        );
    }

    if (data.documentType) {

        const error =
            validateDocumentType(
                data.documentType
            );

        if (error) {
            throw new Error(error);
        }
    }

    const issueDate =
        data.issueDate ||
        document.issueDate;

    const expiryDate =
        data.expiryDate ||
        document.expiryDate;

    if (
        issueDate &&
        expiryDate &&
        expiryDate < issueDate
    ) {
        throw new Error(
            "Expiry date cannot be before issue date"
        );
    }

    return await StaffDocumentRepository.update(
        document,
        data
    );
};


const verifyDocument = async (
    id,
    verifiedBy
) => {

    const document =
        await StaffDocumentRepository.findById(id);

    if (!document) {
        throw new Error(
            "Staff document not found"
        );
    }

    return await StaffDocumentRepository.update(
        document,
        {
            verificationStatus: "VERIFIED",
            verifiedBy: verifiedBy || null,
            verifiedAt: new Date()
        }
    );
};


const rejectDocument = async (
    id,
    remarks
) => {

    const document =
        await StaffDocumentRepository.findById(id);

    if (!document) {
        throw new Error(
            "Staff document not found"
        );
    }

    return await StaffDocumentRepository.update(
        document,
        {
            verificationStatus: "REJECTED",
            remarks: remarks || document.remarks
        }
    );
};


const deleteDocument = async (id) => {

    const document =
        await StaffDocumentRepository.findById(id);

    if (!document) {
        throw new Error(
            "Staff document not found"
        );
    }

    await StaffDocumentRepository.remove(
        document
    );

    return {
        message:
            "Staff document deleted successfully"
    };
};


module.exports = {
    createDocument,
    getDocumentById,
    getDocumentsByStaff,
    getAllDocuments,
    updateDocument,
    verifyDocument,
    rejectDocument,
    deleteDocument
};
