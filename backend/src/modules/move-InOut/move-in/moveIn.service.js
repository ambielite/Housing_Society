const repository = require("./moveIn.repository");
const accessAssignmentService = require("../access/accessAssignment.service");

const documentFields = ["leaseDocument", "registryDocument", "policeVerificationDocument"];

const documentPath = (moveInId, field) => `/move-ins/${moveInId}/documents/${field}`;
const uploadedDocumentPaths = (moveInId, files = {}) => Object.fromEntries(
    documentFields.filter((field) => files[field]?.[0]).map((field) => [field, documentPath(moveInId, field)])
);

const asPlainRecord = (record) => record?.toJSON ? record.toJSON() : record;

const createMoveIn = async (data, files) => {
    const moveIn = await repository.create({
        societyId: data.societyId,
        unitId: data.unitId,
        residentId: data.residentId,
        occupancyType: data.occupancyType,
        requestedMoveInDate: data.requestedMoveInDate,
        agreementId: data.agreementId || null,
        remarks: data.remarks || null
    });
    try {
        await repository.saveDocuments(moveIn.id, files, documentFields);
        const paths = uploadedDocumentPaths(moveIn.id, files);
        if (Object.keys(paths).length) await repository.update(moveIn.id, paths);
        return await getMoveIn(moveIn.id);
    } catch (error) {
        await repository.deleteById(moveIn.id).catch(() => {});
        throw error;
    }
};

const getMoveIns = async () => {
    return (await repository.findAll()).map(asPlainRecord);
};

const getMoveIn = async (id) => {
    return asPlainRecord(await repository.findById(id));
};

const getMoveInDocument = async (id, documentType) => {
    if (!documentFields.includes(documentType)) return null;
    return repository.findDocument(id, documentType);
};

const updateMoveIn = async (id, data, files) => {
    const update = { ...data };

    // The edit form submits an empty string when no agreement is selected.
    // agreementId is a nullable UUID column, so persist it as NULL instead.
    if (update.agreementId === "") update.agreementId = null;

    // Document fields are managed through uploaded files, never client paths.
    for (const field of documentFields) delete update[field];

    const moveIn = await repository.update(id, update);
    if (!moveIn) return null;
    await repository.saveDocuments(id, files, documentFields);
    const paths = uploadedDocumentPaths(id, files);
    if (Object.keys(paths).length) await repository.update(id, paths);
    return getMoveIn(id);
};

const deleteMoveIn = async (id) => {
    const moveIn = await repository.findById(id);

    if (!moveIn) {
        return null;
    }

    await repository.deleteById(id);

    return moveIn;
};

const submitDocuments = async (id) => {
    const moveIn = await repository.findById(id);

    if (!moveIn) {
        return null;
    }

    if (!["PENDING_DOCUMENTS", "INFORMATION_REQUIRED"].includes(moveIn.status)) {
        throw new Error(
            "Documents can only be submitted when move-in is pending documents"
        );
    }

    if (moveIn.occupancyType === "TENANT" && (!(moveIn.leaseDocument || moveIn.agreementId) || !moveIn.registryDocument || !moveIn.policeVerificationDocument)) {
        throw new Error("Lease/agreement, registry and police verification documents are required for tenant move-in");
    }

    return await repository.update(id, {
        status: "DOCUMENTS_SUBMITTED"
    });
};

const requestMoveInInformation = async (id, informationRequest) => {
    const moveIn = await repository.findById(id);
    if (!moveIn) return null;
    if (!informationRequest || !informationRequest.trim()) throw new Error("Information request details are required");
    if (["COMPLETED", "REJECTED", "CANCELLED"].includes(moveIn.status)) throw new Error("Information cannot be requested for a closed move-in");
    return repository.update(id, { status: "INFORMATION_REQUIRED", informationRequest: informationRequest.trim() });
};

const startVerification = async (id) => {
    const moveIn = await repository.findById(id);

    if (!moveIn) {
        return null;
    }

    if (moveIn.status !== "DOCUMENTS_SUBMITTED") {
        throw new Error(
            "Move-in documents must be submitted before verification"
        );
    }

    return await repository.update(id, {
        status: "UNDER_VERIFICATION"
    });
};

const approveMoveIn = async (id, approvedBy) => {
    const moveIn = await repository.findById(id);

    if (!moveIn) {
        return null;
    }

    if (moveIn.status !== "UNDER_VERIFICATION") {
        throw new Error(
            "Move-in can only be approved after document verification"
        );
    }

    return await repository.update(id, {
        status: "APPROVED",
        gatePassCode: String(Math.floor(100000 + Math.random() * 900000)),
        approvedBy,
        approvedAt: new Date()
    });
};

const rejectMoveIn = async (id, remarks) => {
    const moveIn = await repository.findById(id);

    if (!moveIn) {
        return null;
    }

    return await repository.update(id, {
        status: "REJECTED",
        remarks: remarks || null
    });
};

const issueGatePass = async (id) => {
    const moveIn = await repository.findById(id);

    if (!moveIn) {
        return null;
    }

    if (moveIn.status !== "APPROVED") {
        throw new Error(
            "Gate pass can only be issued after move-in approval"
        );
    }

    return await repository.update(id, {
        status: "GATE_PASS_ISSUED"
    });
};

const markLedgerCreated = async (id) => {
    const moveIn = await repository.findById(id);

    if (!moveIn) {
        return null;
    }

    if (moveIn.status !== "GATE_PASS_ISSUED") {
        throw new Error(
            "Ledger can only be created after gate pass issuance"
        );
    }

    return await repository.update(id, {
        status: "LEDGER_CREATED"
    });
};

const activateAccess = async (id) => {
    const moveIn = await repository.findById(id);

    if (!moveIn) {
        return null;
    }

    if (moveIn.status !== "LEDGER_CREATED") {
        throw new Error(
            "Access can only be activated after ledger creation"
        );
    }

    const existingAssignments = await accessAssignmentService.getAccessByLifecycle("MOVE_IN", id);
    if (!existingAssignments.length) {
        await accessAssignmentService.createAccessAssignment({
            societyId: moveIn.societyId,
            unitId: moveIn.unitId,
            residentId: moveIn.residentId,
            lifecycleType: "MOVE_IN",
            lifecycleId: id,
            accessType: moveIn.occupancyType === "TENANT" ? "TENANT" : "OWNER",
            remarks: "Activated through approved move-in"
        });
    }

    return await repository.update(id, {
        status: "ACCESS_ACTIVATED",
        actualMoveInDate: new Date()
    });
};

const completeMoveIn = async (id) => {
    const moveIn = await repository.findById(id);

    if (!moveIn) {
        return null;
    }

    if (moveIn.status !== "ACCESS_ACTIVATED") {
        throw new Error(
            "Move-in can only be completed after access activation"
        );
    }

    return await repository.update(id, {
        status: "COMPLETED"
    });
};

module.exports = {
    createMoveIn,
    getMoveIns,
    getMoveIn,
    getMoveInDocument,
    updateMoveIn,
    deleteMoveIn,
    submitDocuments,
    requestMoveInInformation,
    startVerification,
    approveMoveIn,
    rejectMoveIn,
    issueGatePass,
    markLedgerCreated,
    activateAccess,
    completeMoveIn
};
