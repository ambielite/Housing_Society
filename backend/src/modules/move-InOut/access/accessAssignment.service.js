const repository = require("./accessAssignment.repository");


const createAccessAssignment = async (data) => {

    const existingAccess =
        await repository.findActiveByResident(
            data.residentId
        );

    const sameUnitAccess =
        existingAccess.find(
            (access) =>
                access.unitId === data.unitId
        );

    if (sameUnitAccess) {
        throw new Error(
            "Resident already has active access for this unit"
        );
    }

    return await repository.create({
        societyId: data.societyId,

        unitId: data.unitId,

        residentId: data.residentId,

        lifecycleType: data.lifecycleType,

        lifecycleId: data.lifecycleId,

        accessType: data.accessType,

        accessStatus: "ACTIVE",

        activatedAt:
            data.activatedAt ||
            new Date(),

        activatedBy:
            data.activatedBy || null,

        revokedAt: null,

        revokedBy: null,

        remarks:
            data.remarks || null
    });
};


const getAccessAssignments = async () => {
    return await repository.findAll();
};


const getAccessAssignment = async (id) => {
    return await repository.findById(id);
};


const getActiveAccess = async () => {
    return await repository.findActive();
};


const getActiveAccessByUnit = async (
    unitId
) => {
    return await repository.findActiveByUnit(
        unitId
    );
};


const getActiveAccessByResident = async (
    residentId
) => {
    return await repository.findActiveByResident(
        residentId
    );
};


const getAccessHistoryByUnit = async (
    unitId
) => {
    return await repository.findByUnit(
        unitId
    );
};


const getAccessHistoryByResident = async (
    residentId
) => {
    return await repository.findByResident(
        residentId
    );
};


const getAccessByLifecycle = async (
    lifecycleType,
    lifecycleId
) => {
    return await repository.findByLifecycle(
        lifecycleType,
        lifecycleId
    );
};


const revokeAccess = async (
    id,
    revokedBy,
    remarks
) => {

    const assignment =
        await repository.findById(id);

    if (!assignment) {
        throw new Error(
            "Access assignment not found"
        );
    }

    if (
        assignment.accessStatus ===
        "REVOKED"
    ) {
        throw new Error(
            "Access is already revoked"
        );
    }

    return await repository.update(id, {
        accessStatus: "REVOKED",

        revokedAt: new Date(),

        revokedBy,

        remarks:
            remarks ||
            "Access revoked"
    });
};


const suspendAccess = async (
    id,
    remarks
) => {

    const assignment =
        await repository.findById(id);

    if (!assignment) {
        throw new Error(
            "Access assignment not found"
        );
    }

    if (
        assignment.accessStatus !==
        "ACTIVE"
    ) {
        throw new Error(
            "Only active access can be suspended"
        );
    }

    return await repository.update(id, {
        accessStatus: "SUSPENDED",

        remarks:
            remarks ||
            "Access suspended"
    });
};


const reactivateAccess = async (
    id,
    activatedBy,
    remarks
) => {

    const assignment =
        await repository.findById(id);

    if (!assignment) {
        throw new Error(
            "Access assignment not found"
        );
    }

    if (
        assignment.accessStatus ===
        "ACTIVE"
    ) {
        throw new Error(
            "Access is already active"
        );
    }

    return await repository.update(id, {
        accessStatus: "ACTIVE",

        activatedAt: new Date(),

        activatedBy,

        revokedAt: null,

        revokedBy: null,

        remarks:
            remarks ||
            "Access reactivated"
    });
};


const deleteAccessAssignment = async (
    id
) => {

    const assignment =
        await repository.deleteById(id);

    if (!assignment) {
        throw new Error(
            "Access assignment not found"
        );
    }

    return assignment;
};


module.exports = {
    createAccessAssignment,
    getAccessAssignments,
    getAccessAssignment,
    getActiveAccess,
    getActiveAccessByUnit,
    getActiveAccessByResident,
    getAccessHistoryByUnit,
    getAccessHistoryByResident,
    getAccessByLifecycle,
    revokeAccess,
    suspendAccess,
    reactivateAccess,
    deleteAccessAssignment
};