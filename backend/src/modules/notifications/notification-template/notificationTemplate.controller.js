
const service =
    require("./notificationTemplate.service");

const createTemplate = async (
    req,
    res
) => {

    try {

        const template =
            await service.createTemplate(
                req.body
            );

        res.status(201).json({
            success: true,
            message:
                "Notification template created successfully",
            data: template
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getAllTemplates = async (
    req,
    res
) => {

    try {

        const templates =
            await service.getAllTemplates(
                req.query
            );

        res.status(200).json({
            success: true,
            message:
                "Notification templates fetched successfully",
            data: templates
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getTemplateById = async (
    req,
    res
) => {

    try {

        const template =
            await service.getTemplateById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Notification template fetched successfully",
            data: template
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

const updateTemplate = async (
    req,
    res
) => {

    try {

        const template =
            await service.updateTemplate(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message:
                "Notification template updated successfully",
            data: template
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const activateTemplate = async (
    req,
    res
) => {

    try {

        const template =
            await service.activateTemplate(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Notification template activated successfully",
            data: template
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const deactivateTemplate = async (
    req,
    res
) => {

    try {

        const template =
            await service.deactivateTemplate(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message:
                "Notification template deactivated successfully",
            data: template
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const deleteTemplate = async (
    req,
    res
) => {

    try {

        await service.deleteTemplate(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message:
                "Notification template deleted successfully"
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createTemplate,
    getAllTemplates,
    getTemplateById,
    updateTemplate,
    activateTemplate,
    deactivateTemplate,
    deleteTemplate
};

