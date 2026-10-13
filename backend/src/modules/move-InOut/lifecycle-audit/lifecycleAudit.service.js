const repository =
    require("./lifecycleAudit.repository");


const createAudit = async (data) => {

    return await repository.create({
        lifecycleType: data.lifecycleType,
        lifecycleId: data.lifecycleId,
        action: data.action,
        previousStatus: data.previousStatus || null,
        newStatus: data.newStatus || null,
        performedBy: data.performedBy || null,
        performedAt: data.performedAt || new Date(),
        remarks: data.remarks || null,
        metadata: data.metadata || null
    });
};


const getAudits = async () => {

    return await repository.findAll();
};


const getAudit = async (id) => {

    const audit =
        await repository.findById(id);

    if (!audit) {
        throw new Error(
            "Lifecycle audit not found"
        );
    }

    return audit;
};


const getAuditsByLifecycle = async (
    lifecycleType,
    lifecycleId
) => {

    return await repository.findByLifecycle(
        lifecycleType,
        lifecycleId
    );
};


const getAuditsByPerformer = async (
    performedBy
) => {

    return await repository.findByPerformer(
        performedBy
    );
};


const getAuditsByAction = async (
    action
) => {

    return await repository.findByAction(
        action
    );
};


const updateAudit = async (id, data) => {

    const audit =
        await repository.findById(id);

    if (!audit) {
        throw new Error(
            "Lifecycle audit not found"
        );
    }

    return await repository.update(id, data);
};


const deleteAudit = async (id) => {

    const audit =
        await repository.deleteById(id);

    if (!audit) {
        throw new Error(
            "Lifecycle audit not found"
        );
    }

    return audit;
};


module.exports = {
    createAudit,
    getAudits,
    getAudit,
    getAuditsByLifecycle,
    getAuditsByPerformer,
    getAuditsByAction,
    updateAudit,
    deleteAudit
};