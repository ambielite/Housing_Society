const organizationRepository = require("./organization.repository");


const createOrganization = async (data) => {

    const existingOrganization =
        await organizationRepository.findByCode(data.code);

    if (existingOrganization) {
        throw new Error(
            "Organization code already exists"
        );
    }

    return await organizationRepository.create({
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        description: data.description || null,
        status: data.status || "ACTIVE"
    });
};


const getOrganizations = async () => {

    return await organizationRepository.findAll();
};


const getOrganizationById = async (id) => {

    const organization =
        await organizationRepository.findById(id);

    if (!organization) {
        throw new Error(
            "Organization not found"
        );
    }

    return organization;
};


const updateOrganization = async (id, data) => {

    const organization =
        await organizationRepository.findById(id);

    if (!organization) {
        throw new Error(
            "Organization not found"
        );
    }


    if (data.code) {

        const existingOrganization =
            await organizationRepository.findByCode(
                data.code.trim().toUpperCase()
            );

        if (
            existingOrganization &&
            existingOrganization.id !== id
        ) {
            throw new Error(
                "Organization code already exists"
            );
        }
    }


    const updateData = {};

    if (data.name !== undefined) {
        updateData.name = data.name.trim();
    }

    if (data.code !== undefined) {
        updateData.code =
            data.code.trim().toUpperCase();
    }

    if (data.description !== undefined) {
        updateData.description =
            data.description;
    }

    if (data.status !== undefined) {
        updateData.status =
            data.status;
    }


    return await organizationRepository.update(
        organization,
        updateData
    );
};


const activateOrganization = async (id) => {

    const organization =
        await organizationRepository.findById(id);

    if (!organization) {
        throw new Error(
            "Organization not found"
        );
    }

    return await organizationRepository.update(
        organization,
        {
            status: "ACTIVE"
        }
    );
};


const deactivateOrganization = async (id) => {

    const organization =
        await organizationRepository.findById(id);

    if (!organization) {
        throw new Error(
            "Organization not found"
        );
    }

    return await organizationRepository.update(
        organization,
        {
            status: "INACTIVE"
        }
    );
};


const deleteOrganization = async (id) => {

    const organization =
        await organizationRepository.findById(id);

    if (!organization) {
        throw new Error(
            "Organization not found"
        );
    }

    await organizationRepository.remove(
        organization
    );

    return {
        message: "Organization deleted successfully"
    };
};


module.exports = {
    createOrganization,
    getOrganizations,
    getOrganizationById,
    updateOrganization,
    activateOrganization,
    deactivateOrganization,
    deleteOrganization
};