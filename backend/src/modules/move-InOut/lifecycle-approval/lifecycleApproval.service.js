const repository = require("./lifecycleApproval.repository");

const createApproval = async (data) => {

    return await repository.create({
        lifecycleType: data.lifecycleType,
        lifecycleId: data.lifecycleId,
        approvalType: data.approvalType,
        status: "PENDING",
        assignedTo: data.assignedTo || null,
        actionBy: null,
        actionAt: null,
        remarks: data.remarks || null
    });
};


const getApprovals = async () => {
    return await repository.findAll();
};


const getApproval = async (id) => {

    const approval = await repository.findById(id);

    if (!approval) {
        throw new Error("Lifecycle approval not found");
    }

    return approval;
};


const getPendingApprovals = async () => {
    return await repository.findPending();
};


const getApprovalsByLifecycle = async (
    lifecycleType,
    lifecycleId
) => {

    return await repository.findByLifecycle(
        lifecycleType,
        lifecycleId
    );
};


const approveApproval = async (
    id,
    actionBy,
    remarks
) => {

    const approval = await repository.findById(id);

    if (!approval) {
        throw new Error("Lifecycle approval not found");
    }

    if (approval.status !== "PENDING") {
        throw new Error(
            `Approval cannot be approved because its current status is ${approval.status}`
        );
    }

    return await repository.update(id, {
        status: "APPROVED",
        actionBy,
        actionAt: new Date(),
        remarks: remarks || null
    });
};


const rejectApproval = async (
    id,
    actionBy,
    remarks
) => {

    const approval = await repository.findById(id);

    if (!approval) {
        throw new Error("Lifecycle approval not found");
    }

    if (approval.status !== "PENDING") {
        throw new Error(
            `Approval cannot be rejected because its current status is ${approval.status}`
        );
    }

    if (!remarks || remarks.trim() === "") {
        throw new Error(
            "Remarks are required when rejecting an approval"
        );
    }

    return await repository.update(id, {
        status: "REJECTED",
        actionBy,
        actionAt: new Date(),
        remarks
    });
};


const deleteApproval = async (id) => {

    const approval = await repository.deleteById(id);

    if (!approval) {
        throw new Error("Lifecycle approval not found");
    }

    return approval;
};


module.exports = {
    createApproval,
    getApprovals,
    getApproval,
    getPendingApprovals,
    getApprovalsByLifecycle,
    approveApproval,
    rejectApproval,
    deleteApproval
};