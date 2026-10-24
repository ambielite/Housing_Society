const repository = require("./agreement.repository");
const documentFields = ["agreementDocument", "signedAgreementCopy"];
const documentPath = (agreementId, field) => `/agreements/${agreementId}/documents/${field}`;
const uploadedDocumentPaths = (agreementId, files = {}) => Object.fromEntries(
    documentFields.filter((field) => files[field]?.[0]).map((field) => [field, documentPath(agreementId, field)])
);
const asPlainRecord = (record) => record?.toJSON ? record.toJSON() : record;

const normalizeAgreementData = (data = {}) => {
    const { agreementDocument, signedAgreementCopy, renewalAgreementDocument, ...fields } = data;
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

    const agreement = await repository.create({
        ...data,
        status: "DRAFT",
        renewalStatus: "NOT_REQUIRED"
    });
    try {
        await repository.saveDocuments(agreement.id, files, documentFields);
        const paths = uploadedDocumentPaths(agreement.id, files);
        if (Object.keys(paths).length) await repository.update(agreement.id, paths);
        return asPlainRecord(await repository.findById(agreement.id));
    } catch (error) {
        await repository.deleteById(agreement.id).catch(() => {});
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

    return asPlainRecord(agreement);
};

const getAgreementDocument = async (id, documentType) => {
    if (!documentFields.includes(documentType)) return null;
    return repository.findDocument(id, documentType);
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

    const updateFields = { ...data };
    for (const field of documentFields) delete updateFields[field];
    const updated = await repository.update(id, updateFields);
    if (!updated) return null;
    await repository.saveDocuments(id, files, documentFields);
    const paths = uploadedDocumentPaths(id, files);
    if (Object.keys(paths).length) await repository.update(id, paths);
    return asPlainRecord(await repository.findById(id));
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
    getAgreementDocument,
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
