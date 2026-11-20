const { Op, QueryTypes } = require("sequelize");
const sequelize = require("../../config/database");
const Unit = require("../societies/unit/unit.model");
const Occupancy = require("./occupancy/occupancy.model");

const recalculateUnitStatus = async ({ societyId, unitId, effectiveDate, transaction }) => {
    if (!societyId || !unitId || !effectiveDate || !transaction) {
        throw new Error("Society, unit, effective date and transaction are required to recalculate Unit status");
    }

    const [unitScope] = await sequelize.query(
        `SELECT u.id, u.status
           FROM units u
           JOIN floors f ON f.id = u.floor_id
           JOIN towers t ON t.id = f.tower_id
          WHERE u.id = :unitId AND t.society_id = :societyId
          LIMIT 1
          FOR UPDATE OF u`,
        {
            replacements: { unitId, societyId },
            type: QueryTypes.SELECT,
            transaction
        }
    );
    if (!unitScope) throw new Error("Unit does not belong to the selected society");

    const effectiveOccupancy = await Occupancy.findOne({
        where: {
            societyId,
            unitId,
            occupancyType: { [Op.in]: ["OWNER", "TENANT"] },
            isCurrent: true,
            startDate: { [Op.lte]: effectiveDate },
            [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: effectiveDate } }]
        },
        transaction,
        lock: transaction.LOCK.UPDATE
    });
    const nextStatus = unitScope.status === "INACTIVE"
        ? "INACTIVE"
        : effectiveOccupancy ? "OCCUPIED" : "VACANT";

    if (unitScope.status !== nextStatus) {
        const unit = await Unit.findByPk(unitId, { transaction, lock: transaction.LOCK.UPDATE });
        if (!unit) throw new Error("Unit not found during status update");
        await unit.update({ status: nextStatus }, { transaction });
    }

    return nextStatus;
};

module.exports = { recalculateUnitStatus };
