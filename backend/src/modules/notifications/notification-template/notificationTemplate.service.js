
const repository =
    require("./notificationTemplate.repository");

const {
    validateCreateTemplate,
    validateUpdateTemplate,
    validateId
} = require("./notification.validation");

const Society =
    require("../../societies/society/society.model");

const createTemplate = async (data) => {

    const errors =
        validateCreateTemplate(data);

    if (errors.length > 0) {
        throw new Error(
            errors.join(", ")
        );
    }

    // Check society
    if (data.societyId) {

        const society =
            await Society.findByPk(
                data.societyId
            );

        if (!society) {
            throw new Error(
                "Society not found"
            );
        }
    }

    // Check duplicate
    const existing =
        await repository.findByCodeAndChannel(
            data.templateCode,
            data.channel,
            data.societyId || null
        );

    if (existing) {
        throw new Error(
            "Notification template with same code and channel already exists"
        );
    }

    return await repository.create(data);
};

const getAllTemplates = async (
    filters = {}
) => {

    const where = {};

    if (filters.societyId) {
        where.societyId =
            filters.societyId;
    }

    if (filters.templateCode) {
        where.templateCode =
            filters.templateCode;
    }

    if (filters.channel) {
        where.channel =
            filters.channel;
    }

    if (filters.status) {
        where.status =
            filters.status;
    }

    return await repository.findAll(
        where
    );
};

const getTemplateById = async (id) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid template ID"
        );
    }

    const template =
        await repository.findById(id);

    if (!template) {
        throw new Error(
            "Notification template not found"
        );
    }

    return template;
};

const updateTemplate = async (
    id,
    data
) => {

    if (!validateId(id)) {
        throw new Error(
            "Invalid template ID"
        );
    }

    const errors =
        validateUpdateTemplate(data);

    if (errors.length > 0) {
        throw new Error(
            errors.join(", ")
        );
    }

    const template =
        await repository.findById(id);

    if (!template) {
        throw new Error(
            "Notification template not found"
        );
    }

    // Prevent changing society
    // after template creation
    if (
        data.societyId &&
        data.societyId !==
        template.societyId
    ) {
        throw new Error(
            "societyId cannot be changed"
        );
    }

    const newCode =
        data.templateCode ||
        template.templateCode;

    const newChannel =
        data.channel ||
        template.channel;

    const existing =
        await repository.findByCodeAndChannel(
            newCode,
            newChannel,
            template.societyId
        );

    if (
        existing &&
        existing.id !== template.id
    ) {
        throw new Error(
            "Another template with same code and channel already exists"
        );
    }

    return await repository.update(
        template,
        data
    );
};

const activateTemplate = async (id) => {

    const template =
        await getTemplateById(id);

    return await repository.update(
        template,
        {
            status: "ACTIVE"
        }
    );
};

const deactivateTemplate = async (id) => {

    const template =
        await getTemplateById(id);

    return await repository.update(
        template,
        {
            status: "INACTIVE"
        }
    );
};

const deleteTemplate = async (id) => {

    const template =
        await getTemplateById(id);

    if (template.status === "ACTIVE") {
        throw new Error(
            "Active notification template cannot be deleted. Deactivate it first."
        );
    }

    return await repository.deleteTemplate(
        template
    );
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

