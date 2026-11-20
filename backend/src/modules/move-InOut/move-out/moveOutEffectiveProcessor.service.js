const sequelize = require("../../../config/database");
const repository = require("./moveOut.repository");
const AccessAssignment = require("../access/accessAssignment.model");
const LifecycleAudit = require("../lifecycle-audit/lifecycleAudit.model");
const BillingResponsibility = require("../billing-responsibility/billingResponsibility.model");
const Resident = require("../../residents/resident/resident.model");
const occupancyService = require("../occupancy/occupancy.service");
const { recalculateUnitStatus } = require("../unitStatus.service");

const getCurrentDateOnly = () => new Date().toISOString().slice(0, 10);

const getLocalDateOnly = () => {
    const now = new Date();
    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");
};

const processEffectiveMoveOut = async (id, options = {}) => {
    const transaction = await sequelize.transaction();
    try {
        const moveOut = await repository.findById(id, { transaction, lock: true });
        if (!moveOut) {
            await transaction.commit();
            return null;
        }
        if (["ACCESS_REVOKED", "COMPLETED"].includes(moveOut.status)) {
            await transaction.commit();
            return moveOut;
        }
        if (moveOut.status !== "MOVE_OUT_PASS_ISSUED") {
            throw new Error("Access can only be revoked after move-out pass issuance");
        }

        const effectiveDate = String(moveOut.effectiveMoveOutDate || moveOut.requestedMoveOutDate).slice(0, 10);
        const processingDate = options.processingDate || getCurrentDateOnly();
        const comparisonDate = options.comparisonDate || getLocalDateOnly();
        if (effectiveDate > comparisonDate) {
            throw new Error(`Access remains active until the approved effective move-out date (${effectiveDate})`);
        }

        await occupancyService.closeOccupancyForMoveOut({
            societyId: moveOut.societyId,
            unitId: moveOut.unitId,
            residentId: moveOut.residentId,
            effectiveDate,
            transaction
        });

        await recalculateUnitStatus({
            societyId: moveOut.societyId,
            unitId: moveOut.unitId,
            effectiveDate,
            transaction
        });

        await AccessAssignment.update(
            { accessStatus: "REVOKED", revokedAt: new Date(), remarks: "Revoked on approved move-out effective date" },
            { where: { societyId: moveOut.societyId, residentId: moveOut.residentId, unitId: moveOut.unitId, accessStatus: "ACTIVE" }, transaction }
        );
        await Resident.update(
            { status: "ARCHIVED" },
            { where: { id: moveOut.residentId, societyId: moveOut.societyId, role: "TENANT" }, transaction }
        );
        await BillingResponsibility.update(
            { isCurrent: false, endDate: processingDate },
            { where: { societyId: moveOut.societyId, residentId: moveOut.residentId, unitId: moveOut.unitId, isCurrent: true }, transaction }
        );
        if (moveOut.revertBillingToOwner !== false) {
            const ownerResponsibility = await BillingResponsibility.findOne({
                where: { societyId: moveOut.societyId, unitId: moveOut.unitId, responsibilityType: "OWNER" },
                order: [["created_at", "DESC"]],
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (ownerResponsibility) {
                await ownerResponsibility.update({ isCurrent: true, startDate: processingDate, endDate: null }, { transaction });
            }
        }

        const update = { status: "ACCESS_REVOKED" };
        if (options.setActualMoveOutDate) update.actualMoveOutDate = processingDate;
        const revoked = await repository.update(id, update, transaction);
        await LifecycleAudit.create({
            lifecycleType: "MOVE_OUT",
            lifecycleId: id,
            action: options.scheduled ? "EFFECTIVE_DATE_ACCESS_REVOCATION" : "ACCESS_REVOKED",
            previousStatus: "MOVE_OUT_PASS_ISSUED",
            newStatus: "ACCESS_REVOKED",
            performedAt: new Date(),
            remarks: options.scheduled
                ? "Automated revocation on approved effective date"
                : "Access revoked after approved effective date",
            ...(options.scheduled ? { metadata: { effectiveMoveOutDate: moveOut.effectiveMoveOutDate } } : {})
        }, { transaction });

        await transaction.commit();
        return revoked;
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
};

module.exports = { processEffectiveMoveOut, getCurrentDateOnly };
