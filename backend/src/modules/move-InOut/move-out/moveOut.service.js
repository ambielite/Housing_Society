const repository = require("./moveOut.repository");
const sequelize = require("../../../config/database");
const InvoiceRepository = require("../../financial/invoice/invoice.repository");
const ResidentFinanceService = require("../../resident-finance/residentFinance.service");
const { processEffectiveMoveOut } = require("./moveOutEffectiveProcessor.service");
const ApiError = require("../../../common/ApiError");

const assertNoDuplicateMoveOut = async ({ societyId, residentId, unitId }, excludeId = null) => {
    const records = await repository.findByResidentAndUnit(societyId, residentId, unitId);
    const duplicate = records.find((record) => record.id !== excludeId && !["REJECTED", "CANCELLED"].includes(record.status));
    if (duplicate) throw new ApiError(409, "This resident already has a move-out request or completed move-out for this unit.");
};

const getPendingAmount = async (data, user) => {
    if (!user?.societyId || data.societyId !== user.societyId) {
        const error = new Error("Request society must match the active society");
        error.status = 403;
        throw error;
    }
    return ResidentFinanceService.calculateMoveOutPendingAmount(data);
};

const createMoveOut = async (data, user) => {
    if (!user?.societyId || data.societyId !== user.societyId) {
        const error = new Error("Request society must match the active society");
        error.status = 403;
        throw error;
    }
    await assertNoDuplicateMoveOut(data);
    const effectiveMoveOutDate = data.effectiveMoveOutDate || data.requestedMoveOutDate;
    const transaction = await sequelize.transaction();
    try {
        await InvoiceRepository.lockUnitFinancialScope(data.societyId, data.unitId, transaction);
        const pending = await ResidentFinanceService.calculateMoveOutPendingAmount({
            societyId: data.societyId,
            unitId: data.unitId,
            residentId: data.residentId,
            requestedMoveOutDate: data.requestedMoveOutDate,
            transaction,
        });
        if (pending.amount > 0) {
            const error = new Error(`Please clear the pending amount of ₹${pending.amount.toFixed(2)} before proceeding with move-out.`);
            error.status = 409;
            throw error;
        }
        const moveOut = await repository.create({
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
        }, transaction);
        await transaction.commit();
        return moveOut;
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
};

const getMoveOuts = async () => {
    return await repository.findAll();
};

const getMoveOut = async (id) => {
    return await repository.findById(id);
};

const updateMoveOut = async (id, data) => {
    const current = await repository.findById(id);
    if (!current) return null;
    await assertNoDuplicateMoveOut({
        societyId: data.societyId || current.societyId,
        residentId: data.residentId || current.residentId,
        unitId: data.unitId || current.unitId
    }, id);
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
    return processEffectiveMoveOut(id);
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
    getPendingAmount,
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
