const repository = require("./moveOut.repository");
const AccessAssignment = require("../access/accessAssignment.model");
const LifecycleAudit = require("../lifecycle-audit/lifecycleAudit.model");
const BillingResponsibility = require("../billing-responsibility/billingResponsibility.model");
const Resident = require("../../residents/resident/resident.model");

const createMoveOut = async (data) => {
    const effectiveMoveOutDate = data.effectiveMoveOutDate || data.requestedMoveOutDate;
    return await repository.create({
        societyId: data.societyId,
        unitId: data.unitId,
        residentId: data.residentId,
        requestedMoveOutDate: data.requestedMoveOutDate,
        effectiveMoveOutDate,
        configuredCharges: data.configuredCharges || 0,
        revertBillingToOwner: data.revertBillingToOwner !== false,
        checklistTasks: Array.isArray(data.checklistTasks) ? data.checklistTasks : [],
        remarks: data.remarks || null,
        status: "REQUESTED"
    });
};

const getMoveOuts = async () => {
    return await repository.findAll();
};

const getMoveOut = async (id) => {
    return await repository.findById(id);
};

const updateMoveOut = async (id, data) => {
    return await repository.update(id, data);
};

const startChecklist = async (id) => {
    const moveOut = await repository.findById(id);

    if (!moveOut) {
        return null;
    }

    if (moveOut.status !== "REQUESTED") {
        throw new Error(
            "Checklist can only be started for a requested move-out"
        );
    }

    return await repository.update(id, {
        status: "CHECKLIST_PENDING"
    });
};

const completeChecklist = async (id) => {
    const moveOut = await repository.findById(id);

    if (!moveOut) {
        return null;
    }

    if (moveOut.status !== "CHECKLIST_PENDING") {
        throw new Error(
            "Move-out checklist is not pending"
        );
    }

    const incompleteMandatoryTask = (moveOut.checklistTasks || []).find((task) => task.mandatory && !task.completed);
    if (incompleteMandatoryTask) {
        throw new Error(`Complete mandatory checklist task: ${incompleteMandatoryTask.label || incompleteMandatoryTask.name || "unnamed task"}`);
    }

    return await repository.update(id, {
        checklistCompleted: true,
        status: "DUES_PENDING"
    });
};

const updateOutstandingDues = async (
    id,
    outstandingAmount,
    chargesPaid = 0
) => {
    const moveOut = await repository.findById(id);

    if (!moveOut) {
        return null;
    }

    if (moveOut.status !== "DUES_PENDING") {
        throw new Error(
            "Outstanding dues can only be updated after checklist completion"
        );
    }

    const amount = Number(outstandingAmount);

    if (Number.isNaN(amount) || amount < 0) {
        throw new Error(
            "Outstanding amount must be a valid non-negative number"
        );
    }

    const paidCharges = Number(chargesPaid);
    if (!Number.isFinite(paidCharges) || paidCharges < 0 || paidCharges > Number(moveOut.configuredCharges || 0)) {
        throw new Error("Charges paid must be between zero and the configured move-out charges");
    }

    return await repository.update(id, {
        outstandingAmount: amount,
        chargesPaid: paidCharges,
        status: "FINANCIAL_CLEARANCE_PENDING"
    });
};

const submitFinancialClearance = async (id) => {
    const moveOut = await repository.findById(id);

    if (!moveOut) {
        return null;
    }

    if (
        moveOut.status !==
        "FINANCIAL_CLEARANCE_PENDING"
    ) {
        throw new Error(
            "Financial clearance is not pending"
        );
    }

    if (Number(moveOut.outstandingAmount) + Number(moveOut.configuredCharges || 0) - Number(moveOut.chargesPaid || 0) > 0) {
        throw new Error(
            "Outstanding dues and configured move-out charges must be cleared before financial clearance"
        );
    }

    return await repository.update(id, {
        financialClearanceStatus: "CLEARED",
        status: "UNDER_VERIFICATION"
    });
};

const approveMoveOut = async (
    id,
    approvedBy
) => {
    const moveOut = await repository.findById(id);

    if (!moveOut) {
        return null;
    }

    if (moveOut.status !== "UNDER_VERIFICATION") {
        throw new Error(
            "Move-out can only be approved after verification"
        );
    }

    if (
        moveOut.financialClearanceStatus !==
        "CLEARED"
    ) {
        throw new Error(
            "Financial clearance is required before approval"
        );
    }

    return await repository.update(id, {
        status: "APPROVED",
        gatePassCode: String(Math.floor(100000 + Math.random() * 900000)),
        signedOffBy: approvedBy,
        signedOffAt: new Date(),
        approvedBy,
        approvedAt: new Date()
    });
};

const rejectMoveOut = async (
    id,
    remarks
) => {
    const moveOut = await repository.findById(id);

    if (!moveOut) {
        return null;
    }

    return await repository.update(id, {
        status: "REJECTED",
        remarks: remarks || null
    });
};

const issueMoveOutPass = async (id) => {
    const moveOut = await repository.findById(id);

    if (!moveOut) {
        return null;
    }

    if (moveOut.status !== "APPROVED") {
        throw new Error(
            "Move-out pass can only be issued after approval"
        );
    }

    return await repository.update(id, {
        status: "MOVE_OUT_PASS_ISSUED"
    });
};

const revokeAccess = async (id) => {
    const moveOut = await repository.findById(id);

    if (!moveOut) {
        return null;
    }

    if (
        moveOut.status !==
        "MOVE_OUT_PASS_ISSUED"
    ) {
        throw new Error(
            "Access can only be revoked after move-out pass issuance"
        );
    }

    const effectiveDate = new Date(`${moveOut.effectiveMoveOutDate || moveOut.requestedMoveOutDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (effectiveDate > today) {
        throw new Error(`Access remains active until the approved effective move-out date (${moveOut.effectiveMoveOutDate || moveOut.requestedMoveOutDate})`);
    }

    const revoked = await repository.update(id, {
        status: "ACCESS_REVOKED"
    });
    await AccessAssignment.update(
        { accessStatus: "REVOKED", revokedAt: new Date(), remarks: "Revoked on approved move-out effective date" },
        { where: { residentId: moveOut.residentId, unitId: moveOut.unitId, accessStatus: "ACTIVE" } }
    );
    await Resident.update({ status: "ARCHIVED" }, { where: { id: moveOut.residentId, societyId: moveOut.societyId, role: "TENANT" } });
    await BillingResponsibility.update(
        { isCurrent: false, endDate: new Date().toISOString().slice(0, 10) },
        { where: { residentId: moveOut.residentId, unitId: moveOut.unitId, isCurrent: true } }
    );
    if (moveOut.revertBillingToOwner !== false) {
        const ownerResponsibility = await BillingResponsibility.findOne({ where: { unitId: moveOut.unitId, responsibilityType: "OWNER" }, order: [["created_at", "DESC"]] });
        if (ownerResponsibility) await ownerResponsibility.update({ isCurrent: true, startDate: new Date().toISOString().slice(0, 10), endDate: null });
    }
    await LifecycleAudit.create({ lifecycleType: "MOVE_OUT", lifecycleId: id, action: "ACCESS_REVOKED", previousStatus: "MOVE_OUT_PASS_ISSUED", newStatus: "ACCESS_REVOKED", performedAt: new Date(), remarks: "Access revoked after approved effective date" });
    return revoked;
};

const cancelMoveOut = async (id, reason) => {
    const moveOut = await repository.findById(id);
    if (!moveOut) return null;
    if (["ACCESS_REVOKED", "COMPLETED"].includes(moveOut.status)) {
        throw new Error("A move-out cannot be cancelled after access has been revoked");
    }
    if (moveOut.status === "CANCELLED") return moveOut;
    return repository.update(id, { status: "CANCELLED", cancelledAt: new Date(), cancellationReason: reason || "Move-out cancelled" });
};

const completeMoveOut = async (id) => {
    const moveOut = await repository.findById(id);

    if (!moveOut) {
        return null;
    }

    if (moveOut.status !== "ACCESS_REVOKED") {
        throw new Error(
            "Move-out can only be completed after access revocation"
        );
    }

    return await repository.update(id, {
        status: "COMPLETED",
        actualMoveOutDate: new Date()
    });
};

const deleteMoveOut = async (id) => {
    const moveOut = await repository.findById(id);

    if (!moveOut) {
        return null;
    }

    if (moveOut.status !== "REQUESTED") {
        throw new Error("Transition history is retained after review starts; cancel the move-out to preserve its audit record");
    }

    await repository.deleteById(id);

    return moveOut;
};

module.exports = {
    createMoveOut,
    getMoveOuts,
    getMoveOut,
    updateMoveOut,
    deleteMoveOut,
    startChecklist,
    completeChecklist,
    updateOutstandingDues,
    submitFinancialClearance,
    approveMoveOut,
    rejectMoveOut,
    issueMoveOutPass,
    revokeAccess,
    completeMoveOut,
    cancelMoveOut
};
