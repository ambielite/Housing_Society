const Society =
    require("../../societies/society/society.model");

const Staff =
    require("../staff/staff.model");

const gatesRepository =
    require("../../gates/gates.repository");

const Checkpoint =
    require("./checkpoint.model");

const PatrolRepository =
    require("./patrol.repository");

const {
    validateCreate,
    validateUpdate
} = require("./patrol.validation");

const validateGate = async (gateId, societyId) => {
    if (!gateId) return;
    const gate = await gatesRepository.findGateById(gateId);
    if (!gate) throw new Error("Gate not found");
    if (String(gate.society_id) !== String(societyId)) {
        throw new Error("Gate does not belong to this society");
    }
    if (gate.status !== "ACTIVE") throw new Error("Only active gates can be assigned to patrols");
};


// CREATE PATROL
const createPatrol = async (data) => {

    validateCreate(data);


    const society =
        await Society.findByPk(
            data.societyId
        );

    if (!society) {

        throw new Error(
            "Society not found"
        );

    }

    await validateGate(data.gateId, data.societyId);


    const staff =
        await Staff.findByPk(
            data.staffId
        );

    if (!staff) {

        throw new Error(
            "Staff not found"
        );

    }


    if (
        staff.societyId !==
        data.societyId
    ) {

        throw new Error(
            "Staff does not belong to this society"
        );

    }


    if (
        staff.status !== "ACTIVE"
    ) {

        throw new Error(
            "Only active staff can be assigned patrols"
        );

    }


    const existing =
        await PatrolRepository.findByCode(
            data.societyId,
            data.patrolCode
        );

    if (existing) {

        throw new Error(
            "Patrol code already exists in this society"
        );

    }


    const patrol =
        await PatrolRepository.create(
            data
        );


    return patrol;
};


// GET BY ID
const getPatrolById = async (id) => {

    const patrol =
        await PatrolRepository.findById(
            id
        );

    if (!patrol) {

        throw new Error(
            "Patrol not found"
        );

    }

    return patrol;
};


// GET ALL
const getAllPatrols = async (
    filters = {}
) => {

    return await PatrolRepository.findAll(
        filters
    );

};


// ADD CHECKPOINT TO PATROL
const addCheckpointToPatrol = async (
    patrolId,
    data
) => {

    const patrol =
        await PatrolRepository.findById(
            patrolId
        );

    if (!patrol) {

        throw new Error(
            "Patrol not found"
        );

    }


    const checkpoint =
        await Checkpoint.findByPk(
            data.checkpointId
        );

    if (!checkpoint) {

        throw new Error(
            "Checkpoint not found"
        );

    }


    if (
        checkpoint.societyId !==
        patrol.societyId
    ) {

        throw new Error(
            "Checkpoint does not belong to this society"
        );

    }


    if (
        checkpoint.status !== "ACTIVE"
    ) {

        throw new Error(
            "Only active checkpoints can be added"
        );

    }


    const existing =
        await PatrolRepository.findPatrolCheckpoint(
            patrolId,
            data.checkpointId
        );

    if (existing) {

        throw new Error(
            "Checkpoint already added to this patrol"
        );

    }


    const patrolCheckpoint =
        await PatrolRepository.createCheckpoint({
            patrolId,
            checkpointId: data.checkpointId,
            sequenceOrder:
                data.sequenceOrder ||
                checkpoint.sequenceOrder,
            verificationMethod:
                checkpoint.verificationMethod,
            status: "PENDING"
        });


    const checkpoints =
        await PatrolRepository.findPatrolCheckpoints(
            patrolId
        );


    await PatrolRepository.update(
        patrol,
        {
            totalCheckpoints:
                checkpoints.length
        }
    );


    return patrolCheckpoint;
};


// GET PATROL CHECKPOINTS
const getPatrolCheckpoints = async (
    patrolId
) => {

    const patrol =
        await PatrolRepository.findById(
            patrolId
        );

    if (!patrol) {

        throw new Error(
            "Patrol not found"
        );

    }


    return await PatrolRepository
        .findPatrolCheckpoints(
            patrolId
        );

};


// START PATROL
const startPatrol = async (id) => {

    const patrol =
        await PatrolRepository.findById(
            id
        );

    if (!patrol) {

        throw new Error(
            "Patrol not found"
        );

    }


    if (
        patrol.status === "COMPLETED"
    ) {

        throw new Error(
            "Completed patrol cannot be started"
        );

    }


    if (
        patrol.status === "CANCELLED"
    ) {

        throw new Error(
            "Cancelled patrol cannot be started"
        );

    }


    return await PatrolRepository.update(
        patrol,
        {
            status: "IN_PROGRESS",
            startedAt: new Date()
        }
    );

};


// VERIFY CHECKPOINT
const verifyCheckpoint = async (
    patrolId,
    checkpointId,
    data
) => {

    const patrol =
        await PatrolRepository.findById(
            patrolId
        );

    if (!patrol) {

        throw new Error(
            "Patrol not found"
        );

    }


    if (
        patrol.status !== "IN_PROGRESS"
    ) {

        throw new Error(
            "Patrol must be in progress"
        );

    }


    const patrolCheckpoint =
        await PatrolRepository
            .findPatrolCheckpoint(
                patrolId,
                checkpointId
            );

    if (!patrolCheckpoint) {

        throw new Error(
            "Checkpoint is not assigned to this patrol"
        );

    }


    if (
        patrolCheckpoint.status ===
        "VERIFIED"
    ) {

        throw new Error(
            "Checkpoint is already verified"
        );

    }


    const checkpoint =
        await Checkpoint.findByPk(
            checkpointId
        );

    if (!checkpoint) {

        throw new Error(
            "Checkpoint not found"
        );

    }


    const verificationMethod =
        data.verificationMethod ||
        checkpoint.verificationMethod;


    await PatrolRepository
        .updatePatrolCheckpoint(
            patrolCheckpoint,
            {
                status: "VERIFIED",
                verificationMethod,
                verifiedAt: new Date(),
                verifiedLatitude:
                    data.latitude || null,
                verifiedLongitude:
                    data.longitude || null,
                verificationReference:
                    data.verificationReference ||
                    null,
                remarks:
                    data.remarks || null
            }
        );


    const checkpoints =
        await PatrolRepository
            .findPatrolCheckpoints(
                patrolId
            );


    let completedCount = 0;
    let missedCount = 0;


    for (const item of checkpoints) {

        if (
            item.status === "VERIFIED"
        ) {

            completedCount++;

        }

        if (
            item.status === "MISSED"
        ) {

            missedCount++;

        }

    }


    await PatrolRepository.update(
        patrol,
        {
            completedCheckpoints:
                completedCount,

            missedCheckpoints:
                missedCount
        }
    );


    return await PatrolRepository
        .findPatrolCheckpoints(
            patrolId
        );
};


// MARK CHECKPOINT MISSED
const markCheckpointMissed = async (
    patrolId,
    checkpointId,
    remarks
) => {

    const patrol =
        await PatrolRepository.findById(
            patrolId
        );

    if (!patrol) {

        throw new Error(
            "Patrol not found"
        );

    }


    const patrolCheckpoint =
        await PatrolRepository
            .findPatrolCheckpoint(
                patrolId,
                checkpointId
            );

    if (!patrolCheckpoint) {

        throw new Error(
            "Checkpoint is not assigned to this patrol"
        );

    }


    if (
        patrolCheckpoint.status ===
        "VERIFIED"
    ) {

        throw new Error(
            "Verified checkpoint cannot be marked missed"
        );

    }


    await PatrolRepository
        .updatePatrolCheckpoint(
            patrolCheckpoint,
            {
                status: "MISSED",
                remarks:
                    remarks || null
            }
        );


    const checkpoints =
        await PatrolRepository
            .findPatrolCheckpoints(
                patrolId
            );


    let completedCount = 0;
    let missedCount = 0;


    for (const item of checkpoints) {

        if (
            item.status === "VERIFIED"
        ) {

            completedCount++;

        }

        if (
            item.status === "MISSED"
        ) {

            missedCount++;

        }

    }


    await PatrolRepository.update(
        patrol,
        {
            completedCheckpoints:
                completedCount,

            missedCheckpoints:
                missedCount
        }
    );


    return await PatrolRepository
        .findPatrolCheckpoints(
            patrolId
        );
};


// COMPLETE PATROL
const completePatrol = async (
    id
) => {

    const patrol =
        await PatrolRepository.findById(
            id
        );

    if (!patrol) {

        throw new Error(
            "Patrol not found"
        );

    }


    if (
        patrol.status !== "IN_PROGRESS"
    ) {

        throw new Error(
            "Only an in-progress patrol can be completed"
        );

    }


    const checkpoints =
        await PatrolRepository
            .findPatrolCheckpoints(
                id
            );


    let pendingCount = 0;
    let missedCount = 0;
    let completedCount = 0;


    for (const item of checkpoints) {

        if (
            item.status === "PENDING"
        ) {

            pendingCount++;

        }

        if (
            item.status === "MISSED"
        ) {

            missedCount++;

        }

        if (
            item.status === "VERIFIED"
        ) {

            completedCount++;

        }

    }


    if (pendingCount > 0) {

        throw new Error(
            "All patrol checkpoints must be verified or marked missed before completing patrol"
        );

    }


    return await PatrolRepository.update(
        patrol,
        {
            status:
                missedCount > 0
                    ? "MISSED"
                    : "COMPLETED",

            completedAt: new Date(),

            completedCheckpoints:
                completedCount,

            missedCheckpoints:
                missedCount
        }
    );

};


// CANCEL PATROL
const cancelPatrol = async (
    id,
    remarks
) => {

    const patrol =
        await PatrolRepository.findById(
            id
        );

    if (!patrol) {

        throw new Error(
            "Patrol not found"
        );

    }


    if (
        patrol.status === "COMPLETED"
    ) {

        throw new Error(
            "Completed patrol cannot be cancelled"
        );

    }


    return await PatrolRepository.update(
        patrol,
        {
            status: "CANCELLED",
            remarks:
                remarks || patrol.remarks
        }
    );

};


// UPDATE
const updatePatrol = async (
    id,
    data
) => {

    validateUpdate(data);


    const patrol =
        await PatrolRepository.findById(
            id
        );

    if (!patrol) {

        throw new Error(
            "Patrol not found"
        );

    }


    if (
        patrol.status === "COMPLETED"
    ) {

        throw new Error(
            "Completed patrol cannot be updated"
        );

    }

    if (Object.hasOwn(data, "gateId")) {
        await validateGate(data.gateId, patrol.societyId);
    }


    return await PatrolRepository.update(
        patrol,
        data
    );

};


// DELETE
const deletePatrol = async (
    id
) => {

    const patrol =
        await PatrolRepository.findById(
            id
        );

    if (!patrol) {

        throw new Error(
            "Patrol not found"
        );

    }


    await PatrolRepository.remove(
        patrol
    );


    return {
        message:
            "Patrol deleted successfully"
    };
};


module.exports = {

    createPatrol,
    getPatrolById,
    getAllPatrols,
    updatePatrol,
    deletePatrol,
    addCheckpointToPatrol,
    getPatrolCheckpoints,
    startPatrol,
    verifyCheckpoint,
    markCheckpointMissed,
    completePatrol,
    cancelPatrol

};
