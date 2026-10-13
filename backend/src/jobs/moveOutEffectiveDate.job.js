const cron = require("node-cron");
const { Op } = require("sequelize");
const MoveOut = require("../modules/move-InOut/move-out/moveOut.model");
const AccessAssignment = require("../modules/move-InOut/access/accessAssignment.model");
const LifecycleAudit = require("../modules/move-InOut/lifecycle-audit/lifecycleAudit.model");
const BillingResponsibility = require("../modules/move-InOut/billing-responsibility/billingResponsibility.model");
const Resident = require("../modules/residents/resident/resident.model");

const processEffectiveMoveOuts = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const dueMoveOuts = await MoveOut.findAll({
        where: {
            status: "MOVE_OUT_PASS_ISSUED",
            effectiveMoveOutDate: { [Op.lte]: today }
        }
    });

    for (const moveOut of dueMoveOuts) {
        await AccessAssignment.update(
            { accessStatus: "REVOKED", revokedAt: new Date(), remarks: "Revoked on approved move-out effective date" },
            { where: { residentId: moveOut.residentId, unitId: moveOut.unitId, accessStatus: "ACTIVE" } }
        );

        await Resident.update({ status: "ARCHIVED" }, { where: { id: moveOut.residentId, societyId: moveOut.societyId, role: "TENANT" } });
        await BillingResponsibility.update(
            { isCurrent: false, endDate: today },
            { where: { residentId: moveOut.residentId, unitId: moveOut.unitId, isCurrent: true } }
        );
        if (moveOut.revertBillingToOwner !== false) {
            const ownerResponsibility = await BillingResponsibility.findOne({
                where: { unitId: moveOut.unitId, responsibilityType: "OWNER" },
                order: [["created_at", "DESC"]]
            });
            if (ownerResponsibility) await ownerResponsibility.update({ isCurrent: true, startDate: today, endDate: null });
        }

        const [changed] = await MoveOut.update(
            { status: "ACCESS_REVOKED", actualMoveOutDate: today },
            { where: { id: moveOut.id, status: "MOVE_OUT_PASS_ISSUED" } }
        );
        if (!changed) continue;

        await LifecycleAudit.create({
            lifecycleType: "MOVE_OUT",
            lifecycleId: moveOut.id,
            action: "EFFECTIVE_DATE_ACCESS_REVOCATION",
            previousStatus: "MOVE_OUT_PASS_ISSUED",
            newStatus: "ACCESS_REVOKED",
            performedAt: new Date(),
            remarks: "Automated revocation on approved effective date",
            metadata: { effectiveMoveOutDate: moveOut.effectiveMoveOutDate }
        });
    }
};

const startMoveOutEffectiveDateJob = () => cron.schedule("5 0 * * *", () => processEffectiveMoveOuts().catch((error) => console.error("Move-out effective-date job failed:", error.message)));

module.exports = { startMoveOutEffectiveDateJob, processEffectiveMoveOuts };
