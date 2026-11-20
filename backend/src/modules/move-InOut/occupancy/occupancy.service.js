const repository = require("./occupancy.repository");
const Unit = require("../../societies/unit/unit.model");
const Resident = require("../../residents/resident/resident.model");
const sequelize = require("../../../config/database");
const { QueryTypes } = require("sequelize");

const markUnitOccupied = async (unitId, transaction = null) => {
    const unit = await Unit.findByPk(unitId, transaction ? { transaction, lock: transaction.LOCK.UPDATE } : undefined);
    if (unit && unit.status !== "OCCUPIED") {
        await unit.update({ status: "OCCUPIED" }, transaction ? { transaction } : undefined);
    }
};

const lockAndValidateUnitResident = async (data, transaction) => {
    const resident = await Resident.findOne({
        where: { id: data.residentId, societyId: data.societyId },
        transaction,
        lock: transaction.LOCK.UPDATE
    });
    if (!resident) throw new Error("Resident does not belong to the selected society");

    const [unit] = await sequelize.query(
        `SELECT u.id
           FROM units u
           JOIN floors f ON f.id = u.floor_id
           JOIN towers t ON t.id = f.tower_id
          WHERE u.id = :unitId AND t.society_id = :societyId
          LIMIT 1
          FOR UPDATE OF u`,
        {
            replacements: { unitId: data.unitId, societyId: data.societyId },
            type: QueryTypes.SELECT,
            transaction
        }
    );
    if (!unit) throw new Error("Unit does not belong to the selected society");
};

const createOccupancyRecord = async (data, transaction) => repository.create({
        societyId: data.societyId,
        unitId: data.unitId,
        residentId: data.residentId,
        occupancyType: data.occupancyType,
        startDate: data.startDate,
        billingStartDate:
            data.billingStartDate ||
            data.startDate,
        endDate: null,
        billingEndDate: null,
        isCurrent: true
    }, transaction);

const createOccupancy = async (data) => {
    const transaction = await sequelize.transaction();
    try {
        await lockAndValidateUnitResident(data, transaction);
        const existing = await repository.findCurrentBySocietyAndUnit(data.societyId, data.unitId, transaction);
        if (existing.length) throw new Error("Unit already has a current occupancy");

        const occupancy = await createOccupancyRecord(data, transaction);
        await markUnitOccupied(data.unitId, transaction);
        await transaction.commit();
        return occupancy;
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
};

const ensureOccupancyForMoveIn = async (moveIn, effectiveDate, transaction, occupancyType) => {
    await lockAndValidateUnitResident({
        societyId: moveIn.societyId,
        unitId: moveIn.unitId,
        residentId: moveIn.residentId
    }, transaction);

    const current = await repository.findCurrentBySocietyAndUnit(moveIn.societyId, moveIn.unitId, transaction);
    if (current.length > 1) throw new Error("Unit has multiple current occupancy records; resolve them before activating Move-In");
    if (current.length === 1) {
        const existing = current[0];
        const isEffective = String(existing.startDate).slice(0, 10) <= effectiveDate &&
            (!existing.endDate || String(existing.endDate).slice(0, 10) >= effectiveDate);
        if (existing.residentId === moveIn.residentId && existing.occupancyType === occupancyType && isEffective) return existing;
        throw new Error("Unit already has a conflicting current occupancy");
    }

    return repository.create({
        societyId: moveIn.societyId,
        unitId: moveIn.unitId,
        residentId: moveIn.residentId,
        occupancyType,
        startDate: effectiveDate,
        billingStartDate: effectiveDate,
        endDate: null,
        billingEndDate: null,
        isCurrent: true
    }, transaction);
};

const ensureTenantOccupancyForMoveIn = async (moveIn, effectiveDate, transaction) => {
    if (moveIn.occupancyType !== "TENANT") return null;
    return ensureOccupancyForMoveIn(moveIn, effectiveDate, transaction, "TENANT");
};

const ensureOwnerOccupancyForMoveIn = async (moveIn, effectiveDate, transaction) => {
    if (moveIn.occupancyType !== "OWNER") return null;
    return ensureOccupancyForMoveIn(moveIn, effectiveDate, transaction, "OWNER");
};

const closeOccupancyForMoveOut = async ({ societyId, unitId, residentId, effectiveDate, transaction }) => {
    await lockAndValidateUnitResident({ societyId, unitId, residentId }, transaction);
    const current = await repository.findCurrentByRelationship(societyId, unitId, residentId, transaction);
    if (current.length > 1) throw new Error("Move-Out matches multiple current occupancies");
    if (!current.length) return null;
    const occupancy = current[0];
    if (String(effectiveDate).slice(0, 10) < String(occupancy.startDate).slice(0, 10)) {
        throw new Error("Move-Out effective date cannot be before occupancy start date");
    }
    return repository.closeOccupancy(occupancy.id, effectiveDate, transaction);
};

const getOccupancies = async () => {
    return await repository.findAll();
};

const getOccupancy = async (id) => {
    return await repository.findById(id);
};

const getCurrentOccupancyByUnit = async (
    unitId
) => {
    return await repository.findCurrentByUnit(
        unitId
    );
};

const getOccupancyHistoryByUnit = async (
    unitId
) => {
    return await repository.findByUnit(
        unitId
    );
};

const getOccupancyHistoryByResident = async (
    residentId
) => {
    return await repository.findByResident(
        residentId
    );
};

const closeOccupancy = async (
    id,
    endDate
) => {
    const occupancy =
        await repository.findById(id);

    if (!occupancy) {
        return null;
    }

    if (!occupancy.isCurrent) {
        throw new Error(
            "Occupancy is already closed"
        );
    }

    if (
        new Date(endDate) <
        new Date(occupancy.startDate)
    ) {
        throw new Error(
            "End date cannot be before start date"
        );
    }

    return await repository.closeOccupancy(
        id,
        endDate
    );
};

const transferOccupancy = async (data) => {
    const {
        unitId,
        newResidentId,
        newOccupancyType,
        transferDate,
        societyId
    } = data;

    const transaction = await sequelize.transaction();
    try {
        await lockAndValidateUnitResident({ societyId, unitId, residentId: newResidentId }, transaction);
        const current = await repository.findCurrentBySocietyAndUnit(societyId, unitId, transaction);
        if (current.length > 1) throw new Error("Unit has multiple current occupancy records");
        if (current[0]) await repository.closeOccupancy(current[0].id, transferDate, transaction);
        const occupancy = await createOccupancyRecord({
            societyId, unitId, residentId: newResidentId, occupancyType: newOccupancyType,
            startDate: transferDate, billingStartDate: transferDate
        }, transaction);
        await markUnitOccupied(unitId, transaction);
        await transaction.commit();
        return occupancy;
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
};

module.exports = {
    createOccupancy,
    ensureTenantOccupancyForMoveIn,
    ensureOwnerOccupancyForMoveIn,
    closeOccupancyForMoveOut,
    getOccupancies,
    getOccupancy,
    getCurrentOccupancyByUnit,
    getOccupancyHistoryByUnit,
    getOccupancyHistoryByResident,
    closeOccupancy,
    transferOccupancy
};
