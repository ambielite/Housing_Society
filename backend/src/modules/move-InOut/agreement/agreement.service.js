const repository = require("./agreement.repository");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const saveAgreementDocuments = (files = {}) => {
    const uploadDirectory = path.join(process.cwd(), "uploads", "agreement-documents");
    const documentPaths = {};
    const savedFiles = [];
    const fields = ["agreementDocument", "signedAgreementCopy"];

    fs.mkdirSync(uploadDirectory, { recursive: true });
    for (const field of fields) {
        const file = files[field]?.[0];
        if (!file) continue;
        const extension = path.extname(file.originalname).toLowerCase();
        const fileName = `${crypto.randomUUID()}${extension}`;
        const fullPath = path.join(uploadDirectory, fileName);
        fs.writeFileSync(fullPath, file.buffer, { flag: "wx" });
        savedFiles.push(fullPath);
        documentPaths[field] = `/uploads/agreement-documents/${fileName}`;
    }

    return { documentPaths, savedFiles };
};

const removeSavedFiles = (savedFiles) => {
    for (const filePath of savedFiles) {
        try {
            fs.unlinkSync(filePath);
        } catch {
            // Preserve the original database error if cleanup also fails.
        }
    }
};

const normalizeAgreementData = (data = {}) => {
    const { agreementDocument, signedAgreementCopy, ...fields } = data;
    return {
        ...fields,
        ownerId: fields.ownerId || null,
        tenantId: fields.tenantId || null,
        duration: fields.duration === "" || fields.duration == null ? null : Number(fields.duration),
        uploadedAt: fields.uploadedAt || null,
        signedAt: fields.signedAt || null,
        remarks: fields.remarks || null
    };
};

const createAgreement = async (data, files) => {

    data = normalizeAgreementData(data);

    if (data.startDate >= data.expiryDate) {
        throw new Error(
            "Agreement expiry date must be after start date"
        );
    }

    const existingAgreement =
        await repository.findByReference(
            data.agreementReference
        );

    if (existingAgreement) {
        throw new Error(
            "Agreement reference already exists"
        );
    }

    const activeAgreement =
        await repository.findActiveByUnit(
            data.unitId
        );

    if (activeAgreement) {
        throw new Error(
            "Unit already has an active agreement"
        );
    }

    const { documentPaths, savedFiles } = saveAgreementDocuments(files);
    try {
        return await repository.create({
            ...data,
            ...documentPaths,
            status: "DRAFT",
            renewalStatus: "NOT_REQUIRED"
        });
    } catch (error) {
        removeSavedFiles(savedFiles);
        throw error;
    }
};


const getAgreements = async () => {
    return await repository.findAll();
};


const getAgreement = async (id) => {

    const agreement =
        await repository.findById(id);

    if (!agreement) {
        throw new Error(
            "Agreement not found"
        );
    }

    return agreement;
};


const getAgreementByReference = async (
    agreementReference
) => {

    const agreement =
        await repository.findByReference(
            agreementReference
        );

    if (!agreement) {
        throw new Error(
            "Agreement not found"
        );
    }

    return agreement;
};


const getAgreementsByUnit = async (unitId) => {
    return await repository.findByUnit(unitId);
};


const getAgreementsByTenant = async (tenantId) => {
    return await repository.findByTenant(tenantId);
};


const getAgreementsByOwner = async (ownerId) => {
    return await repository.findByOwner(ownerId);
};


const submitAgreement = async (id) => {

    const agreement =
        await repository.findById(id);

    if (!agreement) {
        throw new Error(
            "Agreement not found"
        );
    }

    if (agreement.status !== "DRAFT") {
        throw new Error(
            "Only draft agreements can be submitted"
        );
    }

    return await repository.update(id, {
        status: "SUBMITTED"
    });
};


const startVerification = async (id) => {

    const agreement =
        await repository.findById(id);

    if (!agreement) {
        throw new Error(
            "Agreement not found"
        );
    }

    if (agreement.status !== "SUBMITTED") {
        throw new Error(
            "Only submitted agreements can enter verification"
        );
    }

    return await repository.update(id, {
        status: "UNDER_VERIFICATION"
    });
};


const approveAgreement = async (id) => {

    const agreement =
        await repository.findById(id);

    if (!agreement) {
        throw new Error(
            "Agreement not found"
        );
    }

    if (agreement.status !== "UNDER_VERIFICATION") {
        throw new Error(
            "Only agreements under verification can be approved"
        );
    }

    return await repository.update(id, {
        status: "APPROVED"
    });
};


const activateAgreement = async (id) => {

    const agreement =
        await repository.findById(id);

    if (!agreement) {
        throw new Error(
            "Agreement not found"
        );
    }

    if (agreement.status !== "APPROVED") {
        throw new Error(
            "Only approved agreements can be activated"
        );
    }

    return await repository.update(id, {
        status: "ACTIVE"
    });
};


const rejectAgreement = async (id, remarks) => {

    const agreement =
        await repository.findById(id);

    if (!agreement) {
        throw new Error(
            "Agreement not found"
        );
    }

    if (
        agreement.status !== "SUBMITTED" &&
        agreement.status !== "UNDER_VERIFICATION"
    ) {
        throw new Error(
            "Agreement cannot be rejected in its current status"
        );
    }

    return await repository.update(id, {
        status: "TERMINATED",
        remarks
    });
};


const terminateAgreement = async (
    id,
    remarks
) => {

    const agreement =
        await repository.findById(id);

    if (!agreement) {
        throw new Error(
            "Agreement not found"
        );
    }

    if (agreement.status === "TERMINATED") {
        throw new Error(
            "Agreement is already terminated"
        );
    }

    return await repository.update(id, {
        status: "TERMINATED",
        remarks
    });
};


const markExpiringSoon = async (id) => {

    const agreement =
        await repository.findById(id);

    if (!agreement) {
        throw new Error(
            "Agreement not found"
        );
    }

    if (agreement.status !== "ACTIVE") {
        throw new Error(
            "Only active agreements can be marked as expiring soon"
        );
    }

    return await repository.update(id, {
        status: "EXPIRING_SOON"
    });
};


const markExpired = async (id) => {

    const agreement =
        await repository.findById(id);

    if (!agreement) {
        throw new Error(
            "Agreement not found"
        );
    }

    if (
        agreement.status !== "ACTIVE" &&
        agreement.status !== "EXPIRING_SOON" &&
        agreement.status !== "RENEWAL_INITIATED"
    ) {
        throw new Error(
            "Agreement cannot be marked as expired"
        );
    }

    return await repository.update(id, {
        status: "EXPIRED"
    });
};


const updateAgreement = async (id, data, files) => {

    data = normalizeAgreementData(data);

    const agreement =
        await repository.findById(id);

    if (!agreement) {
        throw new Error(
            "Agreement not found"
        );
    }

    if (
        data.startDate &&
        data.expiryDate &&
        data.startDate >= data.expiryDate
    ) {
        throw new Error(
            "Agreement expiry date must be after start date"
        );
    }

    const { documentPaths, savedFiles } = saveAgreementDocuments(files);
    try {
        return await repository.update(id, { ...data, ...documentPaths });
    } catch (error) {
        removeSavedFiles(savedFiles);
        throw error;
    }
};


const deleteAgreement = async (id) => {

    const agreement =
        await repository.deleteById(id);

    if (!agreement) {
        throw new Error(
            "Agreement not found"
        );
    }

    return agreement;
};


module.exports = {
    createAgreement,
    getAgreements,
    getAgreement,
    getAgreementByReference,
    getAgreementsByUnit,
    getAgreementsByTenant,
    getAgreementsByOwner,
    submitAgreement,
    startVerification,
    approveAgreement,
    activateAgreement,
    rejectAgreement,
    terminateAgreement,
    markExpiringSoon,
    markExpired,
    updateAgreement,
    deleteAgreement
};
