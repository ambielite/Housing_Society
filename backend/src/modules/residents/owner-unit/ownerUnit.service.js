const ownerUnitRepository =
    require("./ownerUnit.repository");

const {
    validateCreateOwnerUnit,
    validateUpdateOwnerUnit,
    validateId
} = require("./ownerUnit.validation");

const Society =
    require("../../../modules/societies/society/society.model");

const Unit =
    require("../../../modules/societies/unit/unit.model");


// IMPORTANT:
// Change this path if your Resident module
// is located somewhere else.
const Resident =
    require("../resident/resident.model");

const markUnitOccupiedForActiveOwnership = async (unitId, relationshipStatus) => {
    if (relationshipStatus !== "ACTIVE") return;
    const unit = await Unit.findByPk(unitId);
    if (unit?.status === "VACANT") {
        await unit.update({ status: "OCCUPIED" });
    }
};


// ============================================================
// CREATE OWNER-UNIT RELATION
// ============================================================

const createOwnerUnit = async (data) => {

    const errors =
        validateCreateOwnerUnit(data);

    if (errors.length > 0) {
        throw new Error(
            errors.join(", ")
        );
    }


    // Check Society
    const society =
        await Society.findByPk(
            data.societyId
        );

    if (!society) {
        throw new Error(
            "Society not found"
        );
    }


    // Check Unit
    const unit =
        await Unit.findByPk(
            data.unitId
        );

    if (!unit) {
        throw new Error(
            "Unit not found"
        );
    }


    // Check Resident / Owner
    const owner =
        await Resident.findByPk(
            data.ownerId
        );

    if (!owner) {
        throw new Error(
            "Owner/Resident not found"
        );
    }


    // Check duplicate active relation
    const existing =
        await ownerUnitRepository.findRelation(
            data.societyId,
            data.ownerId,
            data.unitId
        );

    if (existing) {
        throw new Error(
            "Active owner-unit relationship already exists"
        );
    }


    // Check overlapping history
    const overlapping =
        await ownerUnitRepository.findOverlappingRelation(
            data.societyId,
            data.ownerId,
            data.unitId,
            data.effectiveFrom,
            data.effectiveTo || null
        );

    if (overlapping) {
        throw new Error(
            "Ownership effective dates overlap with an existing record"
        );
    }


    // Only one active primary owner
    if (
        data.ownershipType ===
        "PRIMARY_OWNER"
    ) {

        const primaryOwner =
            await ownerUnitRepository.findPrimaryOwner(
                data.societyId,
                data.unitId
            );

        if (primaryOwner) {
            throw new Error(
                "Unit already has an active primary owner"
            );
        }
    }


    // Validate ownership percentage
    if (
        data.ownershipPercentage !==
        undefined
    ) {

        const owners =
            await ownerUnitRepository.findActiveUnitOwners(
                data.societyId,
                data.unitId
            );

        const currentTotal =
            owners.reduce(
                (sum, item) =>
                    sum +
                    Number(
                        item.ownershipPercentage || 0
                    ),
                0
            );

        const newTotal =
            currentTotal +
            Number(
                data.ownershipPercentage || 0
            );

        if (newTotal > 100) {
            throw new Error(
                "Total ownership percentage cannot exceed 100"
            );
        }
    }


    const relationship = await ownerUnitRepository.create(data);

    // Preserve workflow states such as move-in/out and inactive.
    await markUnitOccupiedForActiveOwnership(unit.id, relationship.status);

    return relationship;
};


// ============================================================
// GET ALL
// ============================================================

const getAllOwnerUnits = async (
    filters = {}
) => {

    const where = {};

    if (filters.societyId) {
        where.societyId =
            filters.societyId;
    }

    if (filters.ownerId) {
        where.ownerId =
            filters.ownerId;
    }

    if (filters.unitId) {
        where.unitId =
            filters.unitId;
    }

    if (filters.ownershipType) {
        where.ownershipType =
            filters.ownershipType;
    }

    if (filters.status) {
        where.status =
            filters.status;
    }

    return await ownerUnitRepository.findAll(
        where
    );
};


// ============================================================
// GET BY ID
// ============================================================

const getOwnerUnitById = async (
    id
) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid owner-unit relationship ID"
        );
    }

    const record =
        await ownerUnitRepository.findById(
            id
        );

    if (!record) {
        throw new Error(
            "Owner-unit relationship not found"
        );
    }

    return record;
};


// ============================================================
// GET ALL OWNERS OF UNIT
// ============================================================

const getUnitOwners = async (
    societyId,
    unitId
) => {

    if (!societyId || !unitId) {
        throw new Error(
            "societyId and unitId are required"
        );
    }

    return await ownerUnitRepository
        .findActiveUnitOwners(
            societyId,
            unitId
        );
};


// ============================================================
// GET ALL UNITS OF OWNER
// ============================================================

const getOwnerUnits = async (
    societyId,
    ownerId
) => {

    if (!societyId || !ownerId) {
        throw new Error(
            "societyId and ownerId are required"
        );
    }

    return await ownerUnitRepository
        .findOwnerUnits(
            societyId,
            ownerId
        );
};


// ============================================================
// UPDATE
// ============================================================

const updateOwnerUnit = async (
    id,
    data
) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid owner-unit relationship ID"
        );
    }

    const record =
        await ownerUnitRepository.findById(
            id
        );

    if (!record) {
        throw new Error(
            "Owner-unit relationship not found"
        );
    }


    const errors =
        validateUpdateOwnerUnit(data);

    if (errors.length > 0) {
        throw new Error(
            errors.join(", ")
        );
    }


    // Don't allow changing ownership identity
    delete data.societyId;
    delete data.ownerId;
    delete data.unitId;


    // Prevent duplicate primary owner
    if (
        data.ownershipType ===
        "PRIMARY_OWNER"
    ) {

        const primaryOwner =
            await ownerUnitRepository.findPrimaryOwner(
                record.societyId,
                record.unitId
            );

        if (
            primaryOwner &&
            primaryOwner.id !== record.id
        ) {
            throw new Error(
                "Unit already has an active primary owner"
            );
        }
    }


    // Check percentage
    if (
        data.ownershipPercentage !==
        undefined
    ) {

        const owners =
            await ownerUnitRepository
                .findActiveUnitOwners(
                    record.societyId,
                    record.unitId
                );

        const total =
            owners
                .filter(
                    item =>
                        item.id !== record.id
                )
                .reduce(
                    (sum, item) =>
                        sum +
                        Number(
                            item.ownershipPercentage ||
                            0
                        ),
                    0
                );

        if (
            total +
            Number(
                data.ownershipPercentage || 0
            ) > 100
        ) {
            throw new Error(
                "Total ownership percentage cannot exceed 100"
            );
        }
    }


    const updated = await ownerUnitRepository.update(
        record,
        data
    );

    await markUnitOccupiedForActiveOwnership(record.unitId, updated.status);
    return updated;
};


// ============================================================
// DEACTIVATE
// ============================================================

const deactivateOwnerUnit = async (
    id,
    effectiveTo
) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid owner-unit relationship ID"
        );
    }

    const record =
        await ownerUnitRepository.findById(
            id
        );

    if (!record) {
        throw new Error(
            "Owner-unit relationship not found"
        );
    }

    if (
        record.status === "INACTIVE"
    ) {
        throw new Error(
            "Owner-unit relationship is already inactive"
        );
    }


    await ownerUnitRepository.update(
        record,
        {
            status: "INACTIVE",
            effectiveTo:
                effectiveTo ||
                new Date()
                    .toISOString()
                    .split("T")[0]
        }
    );

    return record;
};


// ============================================================
// DELETE
// ============================================================

const deleteOwnerUnit = async (
    id
) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid owner-unit relationship ID"
        );
    }

    const record =
        await ownerUnitRepository.findById(
            id
        );

    if (!record) {
        throw new Error(
            "Owner-unit relationship not found"
        );
    }

    if (
        record.status === "ACTIVE"
    ) {
        throw new Error(
            "Active owner-unit relationship cannot be deleted"
        );
    }

    await ownerUnitRepository.deleteOwnerUnit(
        record
    );

    return {
        message:
            "Owner-unit relationship deleted successfully"
    };
};


module.exports = {
    createOwnerUnit,
    getAllOwnerUnits,
    getOwnerUnitById,
    getUnitOwners,
    getOwnerUnits,
    updateOwnerUnit,
    deactivateOwnerUnit,
    deleteOwnerUnit
};
