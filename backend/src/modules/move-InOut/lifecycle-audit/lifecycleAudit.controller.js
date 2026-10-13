const service =
    require("./lifecycleAudit.service");


const createAudit = async (req, res) => {

    try {

        const audit =
            await service.createAudit(req.body);

        return res.status(201).json({
            success: true,
            message:
                "Lifecycle audit created successfully",
            data: audit
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAudits = async (req, res) => {

    try {

        const audits =
            await service.getAudits();

        return res.status(200).json({
            success: true,
            data: audits
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getAudit = async (req, res) => {

    try {

        const audit =
            await service.getAudit(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            data: audit
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const getAuditsByLifecycle = async (
    req,
    res
) => {

    try {

        const audits =
            await service.getAuditsByLifecycle(
                req.params.lifecycleType,
                req.params.lifecycleId
            );

        return res.status(200).json({
            success: true,
            data: audits
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAuditsByPerformer = async (
    req,
    res
) => {

    try {

        const audits =
            await service.getAuditsByPerformer(
                req.params.performedBy
            );

        return res.status(200).json({
            success: true,
            data: audits
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getAuditsByAction = async (
    req,
    res
) => {

    try {

        const audits =
            await service.getAuditsByAction(
                req.params.action
            );

        return res.status(200).json({
            success: true,
            data: audits
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const updateAudit = async (req, res) => {

    try {

        const audit =
            await service.updateAudit(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message:
                "Lifecycle audit updated successfully",
            data: audit
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const deleteAudit = async (req, res) => {

    try {

        await service.deleteAudit(
            req.params.id
        );

        return res.status(200).json({
            success: true,
            message:
                "Lifecycle audit deleted successfully"
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
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