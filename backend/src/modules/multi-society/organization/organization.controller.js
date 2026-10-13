const organizationService =
    require("./organization.service");


const createOrganization = async (req, res) => {

    try {

        const organization =
            await organizationService.createOrganization(
                req.body
            );

        return res.status(201).json({
            success: true,
            message: "Organization created successfully",
            data: organization
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const getOrganizations = async (req, res) => {

    try {

        const organizations =
            await organizationService.getOrganizations();

        return res.status(200).json({
            success: true,
            data: organizations
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getOrganizationById = async (req, res) => {

    try {

        const organization =
            await organizationService.getOrganizationById(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            data: organization
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const updateOrganization = async (req, res) => {

    try {

        const organization =
            await organizationService.updateOrganization(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message: "Organization updated successfully",
            data: organization
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const activateOrganization = async (req, res) => {

    try {

        const organization =
            await organizationService.activateOrganization(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: "Organization activated successfully",
            data: organization
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const deactivateOrganization = async (req, res) => {

    try {

        const organization =
            await organizationService.deactivateOrganization(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: "Organization deactivated successfully",
            data: organization
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const deleteOrganization = async (req, res) => {

    try {

        const result =
            await organizationService.deleteOrganization(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
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